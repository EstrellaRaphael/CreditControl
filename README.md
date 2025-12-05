# 💳 CreditControl

![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**CreditControl** é um sistema financeiro inteligente focado na gestão de cartões de crédito. Desenvolvido com **Angular 19+** e **Firebase**, ele permite controlar gastos, visualizar o impacto de compras parceladas em meses futuros e gerenciar limites de múltiplos cartões.

O projeto é um **PWA (Progressive Web App)**, totalmente responsivo (Mobile First) e instalável em dispositivos móveis.

---

## 🚀 Funcionalidades

- ✅ **Autenticação Segura**: Login social via Google (Firebase Auth).
- ✅ **Multi-Tenant**: Dados isolados por usuário com Regras de Segurança estritas no Firestore.
- ✅ **Gestão de Cartões**: Controle de limite, cores personalizadas e datas de fechamento/vencimento.
- ✅ **Motor de Parcelas Inteligente**:
  - Lógica de "Melhor Dia" de compra.
  - Distribuição automática de parcelas nos meses futuros.
  - Suporte a compras recorrentes (assinaturas).
- ✅ **Dashboard Visual**:
  - Gráficos interativos (Donut e Barras) com `ngx-charts`.
  - KPIs de Fatura Atual e Limite Disponível Global.
  - Navegação entre meses (passado e futuro).
- ✅ **UX Aprimorada**: Notificações Toast, Loading States e Design System com Tailwind.

---

## 🛠️ Stack Tecnológica

- **Frontend**: Angular 19 (Standalone Components)
- **Estilização**: Tailwind CSS
- **Backend & Database**: Firebase (Firestore)
- **Autenticação**: Firebase Auth
- **Gráficos**: ngx-charts
- **Ícones**: Lucide Angular
- **Notificações**: ngx-toastr
- **Hospedagem**: Vercel

---

## 🆓 Acesse Aqui!

[CreditControl](https://credit-control.vercel.app/)
