import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout'; // Importe isso
import { DashboardComponent } from './components/dashboard/dashboard';
import { AuthGuard, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/auth-guard';
import { CartoesPage } from './components/cartoes/cartoes-page/cartoes-page';
import { ComprasPageComponent } from './components/compras/compras-page/compras-page';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['dashboard']);

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [AuthGuard],
        data: { authGuardPipe: redirectLoggedInToDashboard }
    },
    // Nova configuração de rotas protegidas
    {
        path: '',
        component: MainLayoutComponent, // O Layout envolve tudo
        canActivate: [AuthGuard],
        data: { authGuardPipe: redirectUnauthorizedToLogin },
        children: [
            { path: 'dashboard', component: DashboardComponent },

            { path: 'cartoes', component: CartoesPage },

            { path: 'compras', component: ComprasPageComponent },

            { path: 'categorias', loadComponent: () => import('./components/categorias/categorias-page/categorias-page').then(m => m.CategoriasPageComponent) },

            { path: 'parcelas', loadComponent: () => import('./components/parcelas/parcelas-page/parcelas-page').then(m => m.ParcelasPageComponent) },

            { path: 'about', loadComponent: () => import('./components/about/about-page/about-page').then(m => m.AboutPageComponent) },

            { path: 'help', loadComponent: () => import('./components/help/help-page/help-page').then(m => m.HelpPageComponent) },
        ]
    }
];