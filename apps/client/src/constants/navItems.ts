
import { BookOpen, Bot, ChartBar, Frame, Headset, Home, Inbox, LifeBuoy, PieChart, Plus, Send, Settings, Settings2, SquareTerminal, Workflow } from "lucide-react"



export const navData = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navHeader: [
        {
            title: "Home",
            url: "#",
            icon: Home,
        },
        {
            title: "Inbox",
            url: "#",
            icon: Inbox,
        },
    ],
    navMain: [
        {
            title: "Banking",
            url: "#",
            icon: SquareTerminal,
            isActive: true,
            items: [
                {
                    title: "Accounts",
                    url: "#",
                },
                {
                    title: "Bills",
                    url: "#",
                },
                {
                    title: "Beneficiaries",
                    url: "#",
                },
         
            ],
        },
        {
            title: "Payments",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Transfers",
                    url: "#",
                },
                {
                    title: "Requests",
                    url: "#",
                },
                {
                    title: "Transactions",
                    url: "#",
                },
            ],
        },
        {
            title: "Portfolio",
            url: "#",
            icon: Bot,
            items: [
                {
                    title: "Transfers",
                    url: "#",
                },
                {
                    title: "Requests",
                    url: "#",
                },
                {
                    title: "Transactions",
                    url: "#",
                },
            ],
        },
    ],
    automation: [
        {
            title: "Flows",
            url: "#",
            icon: Workflow,
            actions: [
                {
                    title: "Create Flow",
                    action: () => { },
                    icon: Plus
                },
                {
                    title: "View Runs",
                    action: () => { },
                    icon: ChartBar
                },


            ],
        },
    ],
    moneyManagement: [
        {
            title: "Budgets",
            url: "#",
            icon: LifeBuoy,
            actions: [
                {
                    title: "Add budget",
                    action: () => {},
                    icon: Plus
                },
                {
                    title: "View Insights",
                    action: () => { },
                    icon: ChartBar
                },
             

            ],
        },
        // {
        //     title: "Expense",
        //     url: "#",
        //     icon: Send,
        // },
        {
            title: "Finance Actions",
            url: "#",
            icon: Send,
        },
    ],
    onChain: [
        {
            title: "Smart Wallets",
            url: "#",
            icon: Frame,
        },
        {
            title: "Exchange",
            url: "#",
            icon: PieChart,
        },
        {
            title: "Swap",
            url: "#",
            icon: Frame,
        },
    ],
    navFooter: [
        {
            title: "Settings",
            url: "#",
            icon: Settings,
        },
        {
            title: "Support",
            url: "#",
            icon: Headset,
        },
    ]
  }