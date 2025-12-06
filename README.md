# 💳 CreditControl

![Angular](https://img.shields.io/badge/Angular_18+-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

> 🔗 **[Access Now: credit-control.vercel.app](https://credit-control.vercel.app/)**

**CreditControl** is a multi-tenant personal finance ecosystem designed specifically for credit card management and shared household expenses. Unlike generic spreadsheets or apps, it focuses on **financial unpredictability**, allowing users to see exactly how much they will pay in future months based on their installment purchases and recurring subscriptions.

---

## 🚀 Key Features

### 1. 🏠 Shared Households (Multi-User)
Manage finances together. Create a household, invite family members via link, and track shared expenses with granular permissions.
-   **Invite System**: Generate secure invite links to add members.
-   **Roles & Permissions**: Control who can add cards, make purchases, or pay bills.
-   **Attribution**: Track spending by user ("Who bought this?").

### 2. 📊 Intelligent Dashboard (Command Center)
Immediate insight into your month's financial health.
-   **Real-Time KPIs**: Current Bill Total, Available Global Limit.
-   **Smart Stats**:
    -   *Top Spender*: Who is contributing most to this month's bill.
    -   *Favorite Card*: Most used card for active installments.
    -   *Largest Expense*: The biggest single item in your bill.
-   **Visual Analysis**:
    -   *Distribution Chart*: Spending breakdown by card.
    -   *History Chart*: 6-month view to identify trends.

### 3. 💳 Advanced Card Management
Register multiple cards, each with specific rules.
-   **Closing Date Logic**: The system automatically calculates the correct month for a purchase based on the card's "Best Day".
-   **Limit Tracking**: Visual progress bars showing used vs. available limit.

### 4. 🛍️ Purchase Engine & Installments
The core brain of the system.
-   **Installments (Parcelado)**: Automatically generates N future bill items.
-   **Subscriptions (Recurrent)**: Generates perpetual monthly items until cancelled.
-   **Smart Rounding**: Handles cent precision issues in installments (e.g., 100/3 = 33.33, 33.33, 33.34).

### 5. 🧾 Bill & Installment Control
Timeline view of your finances.
-   **Time Travel**: Navigate to future months to see upcoming bills.
-   **Status Tracking**: Mark individual installments or entire months as `PAID`.
-   **Auto-Restock**: Paying a bill automatically restores the credit card limit.

---

## 🛠️ Technology Stack

The project is built on a **Serverless** architecture using modern web standards.

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Angular 18+ | Standalone Components, Signals, Reactive Forms, Router |
| **Styling** | Tailwind CSS | Utility-first, Responsive, Custom Design System |
| **Backend** | Firebase | Firestore (NoSQL), Auth, Security Rules |
| **State** | RxJS | Reactive streams for real-time data updates |
| **Charts** | ngx-charts | SVG-based, responsive, and animated visualizations |
| **Icons** | Lucide Angular | Vector-based, lightweight icons |

---

## 📂 Project Structure

Modular, feature-based architecture:

```
src/app/
├── components/
│   ├── layout/        # App Shell (Sidebar, Mobile Header)
│   ├── dashboard/     # Aggregation Logic & Charts
│   ├── compras/       # Purchase Management (Lists, Modals)
│   ├── cartoes/       # Card & Limit Management
│   ├── parcelas/      # Monthly Bill Timeline
│   ├── categorias/    # Tag Configuration
│   ├── settings/      # Household & User Settings
│   ├── invite/        # Invitation Acceptance Flow
│   └── ui/            # Design System (Button, Card, Badge, etc.)
├── services/          # Data Access Layer (Firebase Wrapper)
├── models/            # Type Definitions (TypeScript Interfaces)
└── utils/             # Pure Logic (Installment Calculator)
```

---

## 🔐 Business Rules & Security

-   **Safe Edit Protocol**: Changing critical financial data (Value, Date) of a purchase triggers a full recalculation of all future installments to ensure consistency.
-   **Referential Integrity**: Prevents deletion of categories or cards that have active linked purchases.
-   **Data Auto-Repair**: Self-healing data structures ensure legacy records are updated to match new schema requirements (e.g., assigning User IDs to old purchases).

---

<p align="center">
  Developed by <strong>Raphael Estrella</strong> 🚀
</p>
