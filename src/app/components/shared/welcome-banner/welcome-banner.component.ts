import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CreditCard, Tag, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-angular';

@Component({
    selector: 'app-welcome-banner',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
      <!-- Background Decorations -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      <div class="relative z-10 grid md:grid-cols-2 gap-8 items-center">
        <!-- Left Content -->
        <div class="space-y-6">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-indigo-200 mb-4">
              <lucide-icon [img]="icons.check" class="w-4 h-4"></lucide-icon>
              <span>Primeiros Passos</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold mb-2">Bem-vindo ao CreditControl</h2>
            <p class="text-indigo-200 text-lg leading-relaxed">
              Assuma o controle total dos seus cartões de crédito. Configure sua conta em 3 passos simples.
            </p>
          </div>

          <button (click)="startOnboarding()" 
            class="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20">
            Começar Agora
            <lucide-icon [img]="icons.arrowRight" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <!-- Right Content (Steps) -->
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div class="space-y-6">
            
            <!-- Step 1 -->
            <div class="flex gap-4">
              <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40">
                <lucide-icon [img]="icons.card" class="w-5 h-5 text-white"></lucide-icon>
              </div>
              <div>
                <h3 class="font-bold text-lg">1. Adicione um Cartão</h3>
                <p class="text-indigo-200 text-sm">Cadastre seus cartões para controlar seus limites.</p>
              </div>
            </div>

            <!-- Arrow -->
            <div class="pl-5 -my-2">
              <div class="w-0.5 h-6 bg-white/20"></div>
            </div>

            <!-- Step 2 -->
            <div class="flex gap-4 opacity-70">
              <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                <lucide-icon [img]="icons.tag" class="w-5 h-5 text-indigo-200"></lucide-icon>
              </div>
              <div>
                <h3 class="font-bold text-lg">2. Crie Categorias</h3>
                <p class="text-indigo-200 text-sm">Organize seus gastos com tags personalizadas.</p>
              </div>
            </div>

            <!-- Arrow -->
            <div class="pl-5 -my-2">
              <div class="w-0.5 h-6 bg-white/10"></div>
            </div>

            <!-- Step 3 -->
            <div class="flex gap-4 opacity-70">
              <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                <lucide-icon [img]="icons.bag" class="w-5 h-5 text-indigo-200"></lucide-icon>
              </div>
              <div>
                <h3 class="font-bold text-lg">3. Lance suas Compras</h3>
                <p class="text-indigo-200 text-sm">Acompanhe suas faturas em tempo real.</p>
              </div>
            </div>

          </div>

          <button (click)="startOnboarding()" 
            class="mt-6 w-full md:hidden inline-flex justify-center items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg">
            Começar Agora
            <lucide-icon [img]="icons.arrowRight" class="w-5 h-5"></lucide-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class WelcomeBannerComponent {
    @Output() action = new EventEmitter<void>();

    readonly icons = {
        card: CreditCard,
        tag: Tag,
        bag: ShoppingBag,
        arrowRight: ArrowRight,
        check: CheckCircle2
    };

    startOnboarding() {
        this.action.emit();
    }
}
