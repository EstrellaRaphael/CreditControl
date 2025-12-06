import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    onSnapshot,
    query,
    where
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { Observable, BehaviorSubject, firstValueFrom, of, switchMap } from 'rxjs';
import {
    Household,
    HouseholdMember,
    HouseholdInvite,
    MemberPermissions,
    DEFAULT_MEMBER_PERMISSIONS,
    OWNER_PERMISSIONS
} from '../models/core.types';

@Injectable({
    providedIn: 'root'
})
export class HouseholdService {
    private firestore = inject(Firestore);
    private auth = inject(Auth);
    private authService = inject(AuthService);

    // Cache do householdId do usuário atual
    private _householdId$ = new BehaviorSubject<string | null>(null);
    householdId$ = this._householdId$.asObservable();

    // Cache das permissões do usuário atual
    private _permissions$ = new BehaviorSubject<MemberPermissions>(DEFAULT_MEMBER_PERMISSIONS);
    permissions$ = this._permissions$.asObservable();

    private _isOwner$ = new BehaviorSubject<boolean>(false);
    isOwner$ = this._isOwner$.asObservable();

    private _initialized = false;

    constructor() {
        // Auto-initialize when user is already logged in (handles page refresh)
        onAuthStateChanged(this.auth, async (user) => {
            if (user && !this._initialized) {
                await this.initialize();
            } else if (!user) {
                // Reset state on logout
                this._householdId$.next(null);
                this._permissions$.next(DEFAULT_MEMBER_PERMISSIONS);
                this._isOwner$.next(false);
                this._initialized = false;
            }
        });
    }

    /**
     * Inicializa o serviço buscando o householdId do usuário.
     * Deve ser chamado após o login.
     */
    async initialize(): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const householdId = userData['householdId'];

            if (householdId) {
                this._householdId$.next(householdId);
                await this.loadPermissions(householdId, user.uid);
            } else {
                // Usuário antigo sem household, cria um
                await this.createDefaultHousehold();
            }
        }

        this._initialized = true;
    }

    /**
     * Cria um Household padrão para novos usuários.
     */
    async createDefaultHousehold(): Promise<string> {
        const user = this.authService.getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const householdId = doc(collection(this.firestore, 'households')).id;

        const household: Household = {
            id: householdId,
            name: `Grupo de ${user.displayName || 'Usuário'}`,
            ownerId: user.uid,
            createdAt: new Date().toISOString()
        };

        const member: HouseholdMember = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: 'owner',
            permissions: OWNER_PERMISSIONS,
            joinedAt: new Date().toISOString()
        };

        // Salva household
        await setDoc(doc(this.firestore, `households/${householdId}`), household);

        // Salva membro (owner)
        await setDoc(doc(this.firestore, `households/${householdId}/members/${user.uid}`), member);

        // Atualiza o doc do usuário
        await setDoc(doc(this.firestore, `users/${user.uid}`), { householdId }, { merge: true });

        this._householdId$.next(householdId);
        this._permissions$.next(OWNER_PERMISSIONS);
        this._isOwner$.next(true);

        return householdId;
    }

    /**
     * Carrega as permissões do usuário atual no household.
     */
    private async loadPermissions(householdId: string, userId: string): Promise<void> {
        const memberRef = doc(this.firestore, `households/${householdId}/members/${userId}`);
        const memberSnap = await getDoc(memberRef);

        if (memberSnap.exists()) {
            const member = memberSnap.data() as HouseholdMember;
            this._permissions$.next(member.permissions);
            this._isOwner$.next(member.role === 'owner');
        }
    }

    /**
     * Retorna o householdId atual (sync).
     */
    getHouseholdId(): string | null {
        return this._householdId$.value;
    }

    /**
     * Retorna as permissões atuais (sync).
     */
    getPermissions(): MemberPermissions {
        return this._permissions$.value;
    }

    /**
     * Verifica se o usuário atual tem uma permissão específica.
     */
    hasPermission(permission: keyof MemberPermissions): boolean {
        return this._permissions$.value[permission];
    }

    /**
     * Retorna os dados do Household atual.
     */
    async getHousehold(): Promise<Household | null> {
        const householdId = this.getHouseholdId();
        if (!householdId) return null;

        const docRef = doc(this.firestore, `households/${householdId}`);
        const snap = await getDoc(docRef);
        return snap.exists() ? { id: snap.id, ...snap.data() } as Household : null;
    }

    /**
     * Lista todos os membros do Household atual (tempo real).
     */
    getMembers(): Observable<HouseholdMember[]> {
        return this.householdId$.pipe(
            switchMap(householdId => {
                if (!householdId) return of([]);

                return new Observable<HouseholdMember[]>(observer => {
                    const membersRef = collection(this.firestore, `households/${householdId}/members`);

                    const unsubscribe = onSnapshot(membersRef, snapshot => {
                        const members = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        } as HouseholdMember));
                        observer.next(members);
                    }, error => observer.error(error));

                    return () => unsubscribe();
                });
            })
        );
    }

    /**
     * Cria um convite por link.
     */
    async createInvite(): Promise<HouseholdInvite> {
        const user = this.authService.getCurrentUser();
        const householdId = this.getHouseholdId();
        if (!user || !householdId) throw new Error('Dados inválidos');

        const household = await this.getHousehold();
        if (!household) throw new Error('Household não encontrado');

        const token = this.generateToken();
        const now = new Date();
        const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

        const invite: HouseholdInvite = {
            householdId,
            householdName: household.name,
            invitedBy: user.uid,
            invitedByName: user.displayName || user.email || '',
            token,
            createdAt: now.toISOString(),
            expiresAt: expires.toISOString(),
            status: 'pending'
        };

        await setDoc(doc(this.firestore, `invites/${token}`), invite);

        return { ...invite, id: token };
    }

    /**
     * Aceita um convite e entra no Household.
     */
    async acceptInvite(token: string): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Busca o convite
        const inviteRef = doc(this.firestore, `invites/${token}`);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) throw new Error('Convite não encontrado');

        const invite = inviteSnap.data() as HouseholdInvite;

        // Verifica validade
        if (invite.status !== 'pending') throw new Error('Convite já foi utilizado');
        if (new Date(invite.expiresAt) < new Date()) throw new Error('Convite expirado');

        // Adiciona como membro
        const member: HouseholdMember = {
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: 'member',
            permissions: DEFAULT_MEMBER_PERMISSIONS,
            joinedAt: new Date().toISOString()
        };

        await setDoc(doc(this.firestore, `households/${invite.householdId}/members/${user.uid}`), member);

        // Atualiza o householdId do usuário
        await setDoc(doc(this.firestore, `users/${user.uid}`), { householdId: invite.householdId }, { merge: true });

        // Marca convite como aceito
        await setDoc(inviteRef, { status: 'accepted' }, { merge: true });

        // Atualiza estado local
        this._householdId$.next(invite.householdId);
        this._permissions$.next(DEFAULT_MEMBER_PERMISSIONS);
        this._isOwner$.next(false);
    }

    /**
     * Remove um membro do Household (apenas owner).
     */
    async removeMember(memberId: string): Promise<void> {
        if (!this._isOwner$.value) throw new Error('Apenas o dono pode remover membros');

        const householdId = this.getHouseholdId();
        if (!householdId) throw new Error('Household não encontrado');

        // Deleta o membro
        await deleteDoc(doc(this.firestore, `households/${householdId}/members/${memberId}`));

        // Cria um novo Household para o membro removido
        const removedUserRef = doc(this.firestore, `users/${memberId}`);
        await setDoc(removedUserRef, { householdId: null }, { merge: true });
    }

    /**
     * Sai do Household atual (apenas membros, não owner).
     */
    async leaveHousehold(): Promise<void> {
        const user = this.authService.getCurrentUser();
        const householdId = this.getHouseholdId();

        if (!user || !householdId) throw new Error('Dados inválidos');
        if (this._isOwner$.value) throw new Error('O dono não pode sair do grupo');

        // Remove a si mesmo
        await deleteDoc(doc(this.firestore, `households/${householdId}/members/${user.uid}`));

        // Cria novo Household pessoal
        await this.createDefaultHousehold();
    }

    /**
     * Atualiza as permissões de um membro (apenas owner).
     */
    async updateMemberPermissions(memberId: string, permissions: MemberPermissions): Promise<void> {
        if (!this._isOwner$.value) throw new Error('Apenas o dono pode alterar permissões');

        const householdId = this.getHouseholdId();
        if (!householdId) throw new Error('Household não encontrado');

        const memberRef = doc(this.firestore, `households/${householdId}/members/${memberId}`);
        await setDoc(memberRef, { permissions }, { merge: true });
    }

    /**
     * Atualiza o nome do Household (apenas owner).
     */
    async updateHouseholdName(name: string): Promise<void> {
        if (!this._isOwner$.value) throw new Error('Apenas o dono pode renomear o grupo');

        const householdId = this.getHouseholdId();
        if (!householdId) throw new Error('Household não encontrado');

        await setDoc(doc(this.firestore, `households/${householdId}`), { name }, { merge: true });
    }

    /**
     * Gera um token único para convites.
     */
    private generateToken(): string {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}
