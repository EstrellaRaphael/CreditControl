# 💳 CreditControl

![Angular](https://img.shields.io/badge/Angular_21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**CreditControl** é um sistema de gestão financeira pessoal focado em **cartões de crédito**. Desenvolvido com **Angular 21** e **Firebase**, permite controlar gastos, visualizar o impacto de compras parceladas em meses futuros, gerenciar limites de múltiplos cartões e organizar despesas por categorias personalizadas.

O projeto é um **PWA (Progressive Web App)**, totalmente responsivo (Mobile First) e instalável em dispositivos móveis.

🔗 **[Acesse Agora: credit-control.vercel.app](https://credit-control.vercel.app/)**

---

## 🚀 Funcionalidades

### Autenticação
- Login social via **Google** (Firebase Auth).
- Dados isolados por usuário (Multi-Tenant).

### Gestão de Cartões
- Cadastro com limite, cor personalizada e datas de fechamento/vencimento.
- Visualização do limite utilizado em tempo real.

### Lançamento de Compras
- **À Vista, Parcelado (2-24x) e Recorrente (assinaturas).**
- Motor de parcelas inteligente:
  - Lógica de "Melhor Dia" de compra baseada no fechamento do cartão.
  - Distribuição automática de parcelas nos meses futuros.
  - Ajuste de centavos na primeira parcela.
- Funcionalidades completas de **CRUD** (Adicionar, Editar, Excluir).

### Categorias
- Categorias personalizadas com cor.
- Validação: Impede exclusão de categorias em uso.
- Edição inline de nome e cor.

### Dashboard
- KPIs: Fatura Atual, Limite Global Disponível.
- Gráficos interativos (**Donut** e **Barras**) com `ngx-charts`.
- Navegação entre meses (histórico e projeção futura).

### UX/UI
- Design System moderno com **Tailwind CSS**.
- Componentes de Modal de Confirmação customizados.
- Notificações Toast (`ngx-toastr`).
- Ícones elegantes (`lucide-angular`).
- Estados de Loading e Empty States.

---

## 🛠️ Stack Tecnológica

| Camada            | Tecnologia                       |
| ----------------- | -------------------------------- |
| **Frontend**      | Angular 21 (Standalone Components) |
| **Estilização**   | Tailwind CSS 3                   |
| **Backend/DB**    | Firebase Firestore               |
| **Autenticação**  | Firebase Auth (Google Provider)  |
| **Gráficos**      | @swimlane/ngx-charts             |
| **Ícones**        | Lucide Angular                   |
| **Notificações**  | ngx-toastr                       |
| **Hospedagem**    | Vercel                           |
| **Testes**        | Vitest                           |

---

## 📂 Estrutura do Projeto

```
src/app/
├── components/
│   ├── auth/          # Login Page
│   ├── cartoes/       # CRUD de Cartões
│   ├── categorias/    # CRUD de Categorias
│   ├── compras/       # CRUD de Compras
│   ├── dashboard/     # Dashboard com KPIs e Gráficos
│   ├── layout/        # Header e Sidebar
│   ├── shared/        # Componentes reutilizáveis (ConfirmModal)
│   ├── about/         # Página Sobre
│   └── help/          # Página de Ajuda
├── services/
│   ├── auth.service.ts
│   ├── cartao.ts
│   ├── categoria.ts
│   ├── compra.ts
│   └── dashboard.ts
├── models/
│   └── core.types.ts  # Interfaces TypeScript
└── utils/
    └── installment-calculator.ts  # Lógica de cálculo de parcelas
```

---

## 📝 Licença

Este projeto é de uso pessoal e educacional.

---

<p align="center">
  Desenvolvido com ❤️ por <strong>Raphael Estrella</strong>
</p>
