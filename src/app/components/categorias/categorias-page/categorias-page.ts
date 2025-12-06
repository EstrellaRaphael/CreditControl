import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
    private cdr = inject(ChangeDetectorRef);

    categorias$: Observable<Categoria[]> = this.categoriaService.getCategorias();

    readonly icons = { trash: Trash2, plus: Plus, tag: Tag, edit: Edit, x: X };

    editingCategoria: Categoria | null = null;

    isConfirmModalOpen = false;
    confirmModalConfig = {
        title: '',
        message: '',
        type: 'warning' as 'warning' | 'danger' | 'info',
        confirmText: 'Confirmar',
        action: () => { }
    };

    form: FormGroup = this.fb.group({
        nome: ['', Validators.required],
        cor: ['#6366f1']
    });

    presetColors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
        '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
    ];

    selectColor(color: string) {
        this.form.patchValue({ cor: color });
    }

    editCategoria(cat: Categoria) {
        this.editingCategoria = cat;
        this.form.patchValue({ nome: cat.nome, cor: cat.cor });
    }

    cancelEdit() {
        this.editingCategoria = null;
        this.form.reset({ nome: '', cor: '#6366f1' });
    }

    async onSubmit() {
        if (this.form.invalid) return;

        const data = this.form.value;
        try {
            if (this.editingCategoria?.id) {
                await this.categoriaService.updateCategoria(this.editingCategoria.id, data);
                this.toastr.success('Categoria atualizada.', 'Feito');
            } else {
                await this.categoriaService.addCategoria(data);
                this.toastr.success('Categoria criada.', 'Feito');
            }
            this.cancelEdit();
        } catch (error) {
            console.error(error);
            this.toastr.error('Erro ao salvar categoria.', 'Erro');
        }
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
        this.cdr.detectChanges();
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

    closeConfirmModal() {
        this.isConfirmModalOpen = false;
        this.cdr.detectChanges();
    }
}
