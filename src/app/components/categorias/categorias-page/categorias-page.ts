import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LucideAngularModule, Trash2, Plus, Tag } from 'lucide-angular';
import { CategoriaService } from '../../../services/categoria';
import { Observable } from 'rxjs';
import { Categoria } from '../../../models/core.types';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-categorias-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
    templateUrl: './categorias-page.html'
})
export class CategoriasPageComponent {
    private fb = inject(FormBuilder);
    private categoriaService = inject(CategoriaService);
    private toastr = inject(ToastrService);

    categorias$: Observable<Categoria[]> = this.categoriaService.getCategorias();

    readonly icons = { trash: Trash2, plus: Plus, tag: Tag };

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
            await this.categoriaService.addCategoria(this.form.value);
            this.toastr.success('Categoria adicionada!', 'Sucesso');
            this.form.reset({ nome: '', cor: '#3b82f6' });
        } catch (error) {
            console.error(error);
            this.toastr.error('Erro ao adicionar categoria.', 'Erro');
        }
    }

    async deleteCategoria(id: string) {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

        try {
            await this.categoriaService.deleteCategoria(id);
            this.toastr.success('Categoria removida.', 'Feito');
        } catch (error) {
            console.error(error);
            this.toastr.error('Erro ao remover categoria.', 'Erro');
        }
    }
}
