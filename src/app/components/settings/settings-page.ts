import { Component, inject, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Settings, UserPlus, Trash2, LogOut, Copy, Crown, User, Shield, Users, Loader } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';

import { HouseholdService } from '../../services/household.service';
import { Household, HouseholdMember, MemberPermissions } from '../../models/core.types';
import { CardComponent } from '../ui/card/card.component';
import { ButtonComponent } from '../ui/button/button.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';
import { SkeletonComponent } from '../shared/skeleton/skeleton.component';

@Component({
    selector: 'app-settings-page',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, CardComponent, ButtonComponent, ConfirmModalComponent, SkeletonComponent],
    templateUrl: './settings-page.html'
})
export class SettingsPage implements OnInit {
    private householdService = inject(HouseholdService);
    private toastr = inject(ToastrService);
    private ngZone = inject(NgZone);
    private cdr = inject(ChangeDetectorRef);

    readonly icons = {
        settings: Settings,
        userPlus: UserPlus,
        trash: Trash2,
        logout: LogOut,
        copy: Copy,
        crown: Crown,
        user: User,
        shield: Shield,
        users: Users,
        loader: Loader
    };

    household: Household | null = null;
    members: HouseholdMember[] = [];
    isOwner = true;
    isLoading = false; // Start as false for instant render

    inviteLink = '';
    showInviteModal = false;
    isGeneratingInvite = false;

    isConfirmModalOpen = false;
    confirmModalConfig = {
        title: '',
        message: '',
        type: 'danger' as 'warning' | 'danger' | 'info',
        confirmText: 'Confirmar',
        action: () => { }
    };

    showPermissionsModal = false;
    editingMember: HouseholdMember | null = null;
    editingPermissions: MemberPermissions = {
        viewDashboard: true,
        manageCards: false,
        managePurchases: false,
        manageCategories: false,
        payInvoices: false
    };

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        try {
            await this.householdService.initialize();
            this.household = await this.householdService.getHousehold();

            this.householdService.getMembers().subscribe(members => {
                this.ngZone.run(() => {
                    this.members = members;
                    this.cdr.detectChanges();
                });
            });

            this.householdService.isOwner$.subscribe(isOwner => {
                this.ngZone.run(() => {
                    this.isOwner = isOwner;
                    this.cdr.detectChanges();
                });
            });
        } catch (error: any) {
            console.error('Error loading settings:', error);
        }
    }

    async generateInvite() {
        this.isGeneratingInvite = true;
        this.cdr.detectChanges();

        try {
            const invite = await this.householdService.createInvite();
            this.ngZone.run(() => {
                this.inviteLink = `${window.location.origin}/invite/${invite.token}`;
                this.showInviteModal = true;
                this.isGeneratingInvite = false;
                this.cdr.detectChanges();
            });
        } catch (error: any) {
            this.ngZone.run(() => {
                this.toastr.error(error.message || 'Erro ao gerar convite', 'Erro');
                this.isGeneratingInvite = false;
                this.cdr.detectChanges();
            });
        }
    }

    copyInviteLink() {
        navigator.clipboard.writeText(this.inviteLink);
        this.toastr.success('Link copiado!', 'Pronto');
    }

    closeInviteModal() {
        this.showInviteModal = false;
        this.inviteLink = '';
    }

    confirmRemoveMember(member: HouseholdMember) {
        this.confirmModalConfig = {
            title: 'Remover Membro',
            message: `Deseja remover ${member.displayName || member.email} do grupo?`,
            type: 'danger',
            confirmText: 'Remover',
            action: () => this.removeMember(member.id!)
        };
        this.isConfirmModalOpen = true;
    }

    async removeMember(memberId: string) {
        this.isConfirmModalOpen = false;
        try {
            await this.householdService.removeMember(memberId);
            this.toastr.success('Membro removido', 'Feito');
        } catch (error: any) {
            this.toastr.error(error.message || 'Erro ao remover', 'Erro');
        }
    }

    confirmLeaveHousehold() {
        this.confirmModalConfig = {
            title: 'Sair do Grupo',
            message: 'Deseja sair deste grupo familiar?',
            type: 'warning',
            confirmText: 'Sair',
            action: () => this.leaveHousehold()
        };
        this.isConfirmModalOpen = true;
    }

    async leaveHousehold() {
        this.isConfirmModalOpen = false;
        try {
            await this.householdService.leaveHousehold();
            this.toastr.success('Você saiu do grupo', 'Feito');
            await this.loadData();
        } catch (error: any) {
            this.toastr.error(error.message || 'Erro', 'Erro');
        }
    }

    openPermissionsModal(member: HouseholdMember) {
        this.editingMember = member;
        this.editingPermissions = { ...member.permissions };
        this.showPermissionsModal = true;
    }

    closePermissionsModal() {
        this.showPermissionsModal = false;
        this.editingMember = null;
    }

    async savePermissions() {
        if (!this.editingMember?.id) return;
        try {
            await this.householdService.updateMemberPermissions(this.editingMember.id, this.editingPermissions);
            this.toastr.success('Permissões atualizadas', 'Feito');
            this.closePermissionsModal();
        } catch (error: any) {
            this.toastr.error(error.message || 'Erro', 'Erro');
        }
    }

    togglePermission(key: keyof MemberPermissions) {
        this.editingPermissions[key] = !this.editingPermissions[key];
    }
}
