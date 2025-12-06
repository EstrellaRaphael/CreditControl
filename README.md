# 💳 CreditControl

![Angular](https://img.shields.io/badge/Angular_18-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-4A90E2?style=for-the-badge&logo=pwa&logoColor=white)

**CreditControl** é um ecossistema de gestão financeira projetado especificamente para o controle de cartões de crédito. Diferente de planilhas ou apps genéricos, ele foca na **previsibilidade financeira**, permitindo que o usuário veja exatamente quanto vai pagar nos próximos meses com base em suas compras parceladas e recorrentes (assinaturas).

🔗 **[Acesse Agora: credit-control.vercel.app](https://credit-control.vercel.app/)**

O sistema é construído sobre uma arquitetura **Serverless** (Firebase) com um Frontend **Angular Standalone**, utilizando as práticas mais modernas de desenvolvimento web (Signals, Reactive Forms, Tailwind Design System).

---

## 🏗️ Visão Geral do Sistema

O CreditControl opera em cima de 4 pilares principais:

### 1. Dashboard Inteligente (The Command Center)
O painel principal oferece uma visão imediata da saúde financeira do usuário para o mês atual.
-   **KPIs em Tempo Real**: Total da Fatura do Mês e Limite Global Disponível (soma de todos os cartões).
-   **Análise Visual**:
    -   *Gráfico de Rosca (Donut)*: Mostra exatamente qual cartão está consumindo mais do seu orçamento.
    -   *Gráfico de Histórico*: Uma visão dos últimos 6 meses para identificar tendências de gastos.
    -   *Sistema de Cores*: Cada cartão possui uma cor única que reflete em todos os gráficos e listas.

### 2. Gestão de Cartões
Permite o cadastro de múltiplos cartões de crédito, cada um com suas próprias regras:
-   **Limite Total**: O teto de gastos do cartão.
-   **Data de Vencimento**: Dia em que a fatura deve ser paga.
-   **Tracking de Limite**: O sistema atualiza automaticamente o limite "Usado" a cada compra ou pagamento, oferecendo uma barra de progresso visual.

### 3. Motor de Compras & Parcelamento 🧠
O "cérebro" do sistema. Ao registrar uma compra, o usuário pode escolher entre 3 modalidades que disparam lógicas diferentes:
-   **À Vista**: Gera uma única parcela para o mês atual (ou próximo, dependendo da data de fechamento).
-   **Parcelado (2x a 24x)**: O sistema gera automaticamente N parcelas futuras.
    -   *Smart Rounding*: Se uma compra de R$ 100,00 for dividida em 3x, o sistema gera parcelas de 33,33, 33,33 e 33,34 para garantir a soma exata.
-   **Assinatura (Recorrente)**: Gera parcelas indefinidas que se renovam mensalmente até que o usuário cancele.

### 4. Controle de Faturas (Página de Parcelas)
A visão timeline do sistema. Aqui o usuário pode:
-   Navegar entre meses (Passado, Presente e Futuro).
-   Filtrar por Status (Pendente/Pago), Tipo (Assinatura/Parcelado) ou Cartão.
-   **Baixar Pagamentos**: Ao pagar uma parcela ou uma fatura inteira, o sistema:
    1.  Marca as parcelas como `PAGO`.
    2.  Restaura o limite disponível do cartão correspondente.
    3.  Atualiza o status da "Compra Pai" (ex: "5/10 pagas").

---

## 🔐 Regras de Negócio & Segurança

O CreditControl implementa lógicas robustas para garantir a integridade dos dados:

### Safe Edit Protocol (Edição Segura)
Ao editar uma compra, o sistema analisa inteligentemente o que mudou:
-   **Alterações Cadastrais** (Nome, Categoria): O sistema atualiza os dados visuais sem tocar no histórico financeiro.
-   **Alterações Financeiras** (Valor, Qtde Parcelas, Data): O sistema detecta a mudança crítica, alerta o usuário, reseta o histórico de pagamentos e recria as parcelas do zero para garantir consistência matemática e contábil.

### Integridade Referencial
-   **Proteção de Categorias**: O sistema impede a exclusão de categorias que estejam vinculadas a qualquer compra existente.
-   **Estorno Automático**: Ao excluir uma compra ou cancelar uma assinatura, o sistema calcula automaticamente o valor restante e "estorna" esse montante ao limite do cartão, mantendo o saldo sincronizado.

### Performance Otimizada
-   **Aggregation Queries**: O Dashboard utiliza consultas otimizadas (Range Queries) para buscar dados de múltiplos meses em uma única requisição ao banco de dados, reduzindo custos de leitura e tempo de carregamento.
-   **Lazy Loading**: Todos os módulos pesados (Gráficos, Páginas Secundárias) são carregados sob demanda.

---

## 🎨 Design System & UX

A interface foi desenhada com foco em **Mobile First**, garantindo uma experiência nativa em qualquer dispositivo.

-   **Componentes Primitivos**: `AppCard`, `AppBadge`, `AppButton`, `AppInput`. Todo o UI é construído sobre esses blocos fundamentais para consistência visual.
-   **PWA Ready**: O app pode ser instalado no iOS e Android, oferecendo ícone na home screen e tela cheia (sem barra de navegador).
-   **Micro-interações**: Feedback visual imediato para ações de Sucesso, Erro ou Carregamento (Skeleton Screens).
-   **Accessibility (A11y)**: Navegação por teclado, rótulos ARIA para leitores de tela e contraste de cores verificado.
-   **Ilustrações de Estado Vazio**: Telas de "Sem dados" amigáveis que incentivam o usuário a começar.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Frontend** | Angular 18+ | Standalone Components, Signals, Reactive Forms |
| **Estilo** | Tailwind CSS | Utility-first, Responsivo, Design System customizado |
| **Backend** | Firebase | Firestore (NoSQL), Auth (Authentication), Security Rules |
| **Charts** | ngx-charts | SVG-based, responsivo e animado |
| **Ícones** | Lucide Angular | Ícones vetoriais leves e consistentes |
| **Qualidade** | ESLint / Prettier | Padronização de código |

---

## 📂 Estrutura do Projeto

O código segue uma arquitetura modular baseada em funcionalidades (Feature-based):

```
src/app/
├── components/
│   ├── layout/        # Shell da aplicação (Sidebar, Mobile Header)
│   ├── dashboard/     # Lógica de agregação e gráficos
│   ├── compras/       # Gestão de Compras (Listas, Filtros, Modais)
│   ├── cartoes/       # Gestão de Limites e Cartões
│   ├── parcelas/      # Controle de Faturas Mensais
│   ├── categorias/    # Configuração de Tags
│   ├── ui/            # Design System (Button, Card, Badge, Modal, Input)
│   └── shared/        # Componentes compartilhados (Skeleton, EmptyState, FAB)
├── services/          # Camada de Dados e Regras de Negócio (Firebase)
├── models/            # Interfaces de Tipagem (TypeScript)
└── utils/             # Lógica pura (Calculadora de Parcelas)
```

---

<p align="center">
  Desenvolvido por <strong>Raphael Estrella</strong> 🚀
</p>
