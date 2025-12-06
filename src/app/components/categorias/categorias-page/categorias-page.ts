import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LucideAngularModule, Trash2, Plus, Tag, Edit, X } from 'lucide-angular';
import { CategoriaService } from '../../../services/categoria';
import { CompraService } from '../../../services/compra';
import { Observable } from 'rxjs';
import { Categoria } from '../../../models/core.types';
import { ToastrService } from 'ngx-toastr';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-categorias-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ConfirmModalComponent],
    templateUrl: './categorias-page.html'
})
export class CategoriasPageComponent {
    private fb = inject(FormBuilder);
    private categoriaService = inject(CategoriaService);
    private compraService = inject(CompraService);
    private toastr = inject(ToastrService);

    categorias$: Observable<Categoria[]> = this.categoriaService.getCategorias();

    readonly icons = { trash: Trash2, plus: Plus, tag: Tag, edit: Edit, x: X };

    editingCategoria: Categoria | null = null;

    // Controle do Modal de Confirmação
    isConfirmModalOpen = false;
    confirmModalConfig = {
        title: '',
        message: '',
        type: 'warning' as 'warning' | 'danger' | 'info',
        confirmText: 'Confirmar',
        action: () => { }
    };

    form: FormGroup = this.fb.group({
        nome: ['', [Validators.required, Validators.minLength(2)]],
        cor: ['#3b82f6'] // Default blue
    });

    // Paleta de cores pré-definidas (Tailwind colors)
    readonly presetColors = [
        '#ef4444', // red-500
        '#f97316', // orange-500
        '#f59e0b', // amber-500
        '#84cc16', // lime-500
        '#22c55e', // green-500
        '#10b981', // emerald-500
        '#06b6d4', // cyan-500
        '#3b82f6', // blue-500
        '#6366f1', // indigo-500
        '#8b5cf6', // violet-500
        '#d946ef', // fuchsia-500
        '#ec4899', // pink-500
        '#64748b', // slate-500
    ];

    selectColor(color: string) {
        this.form.patchValue({ cor: color });
    }

    async onSubmit() {
        if (this.form.invalid) return;

        try {
            if (this.editingCategoria && this.editingCategoria.id) {
                await this.categoriaService.updateCategoria(this.editingCategoria.id, this.form.value);
                this.toastr.success('Categoria atualizada!', 'Sucesso');
                this.cancelEdit();
            } else {
                await this.categoriaService.addCategoria(this.form.value);
                this.toastr.success('Categoria adicionada!', 'Sucesso');
                this.form.reset({ nome: '', cor: '#3b82f6' });
            }
        } catch (error) {
            console.error(error);
            this.toastr.error('Erro ao salvar categoria.', 'Erro');
        }
    }

    editCategoria(categoria: Categoria) {
        this.editingCategoria = categoria;
        this.form.patchValue({
            nome: categoria.nome,
            cor: categoria.cor || '#3b82f6'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    cancelEdit() {
        this.editingCategoria = null;
        this.form.reset({ nome: '', cor: '#3b82f6' });
    }

    async deleteCategoria(categoria: Categoria) {
        if (!categoria.id || !categoria.nome) return;

        const isInUse = await this.compraService.checkCategoriaInUse(categoria.nome);
        if (isInUse) {
            this.toastr.warning('Esta categoria está em uso e não pode ser excluída.', 'Atenção');
            return;
        }

        this.confirmModalConfig = {
            title: 'Excluir Categoria',
            message: `Tem certeza que deseja excluir a categoria "${categoria.nome}"?`,
            type: 'danger',
            confirmText: 'Excluir',
            action: () => this.processarExclusao(categoria.id!)
        };
        this.isConfirmModalOpen = true;
    }

    async processarExclusao(id: string) {
        this.isConfirmModalOpen = false;
        try {
            await this.categoriaService.deleteCategoria(id);
            this.toastr.success('Categoria removida.', 'Feito');
        } catch (error) {
            console.error(error);
            this.toastr.error('Erro ao remover categoria.', 'Erro');
        }
    }
}
