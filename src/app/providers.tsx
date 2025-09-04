"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState, useEffect } from "react"
import { WagmiProvider } from "wagmi"
import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import config from "@/rainbowKitConfig"
import "@rainbow-me/rainbowkit/styles.css"

export function Providers(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())
    
    // ایجاد تم سفارشی با رنگ‌های متنوع
    const customTheme = darkTheme({
        borderRadius: "medium",
        accentColor: "#6366f1", // رنگ بنفش ملایم
        accentColorForeground: "white",
        overlayBlur: "small",
    })
    
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={customTheme}>
                    {props.children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}