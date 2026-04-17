"use client"

import * as React from "react"
import {
  Users,
  Briefcase,
  Music,
  Building2,
  LogOut,
  LayoutDashboard,
  UserCog,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Briefcase,
  },
  {
    title: "DJs",
    url: "/djs",
    icon: Music,
  },
  {
    title: "KTV Venues",
    url: "/venues",
    icon: Building2,
  },
]

interface UserInfo {
  id: string;
  username: string;
  full_name?: string;
  email?: string;
  role: string;
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUserInfo(data)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserInfo()
  }, [])

  const displayName = userInfo?.full_name || userInfo?.username || 'Admin Account'
  const displayEmail = userInfo?.email || userInfo?.username || 'admin@example.com'
  const avatarFallback = displayName.substring(0, 2).toUpperCase()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Logged out',
          description: 'You have been successfully logged out.',
        })
        router.push('/login')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      })
    }
  }

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-background shrink-0">
            <Image
              src="https://asianightlife.sg/logo.jpg"
              alt="Asia Nightlife Logo"
              width={32}
              height={32}
              className="h-full w-full object-cover"
              unoptimized
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">AsiaNightLife</span>
            <span className="text-xs text-muted-foreground truncate">Admin Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || (item.url === "/dashboard" && pathname === "/")}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt={displayName} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {isLoading ? (
                        <UserCog className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-semibold">{avatarFallback}</span>
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{isLoading ? 'Loading...' : displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{isLoading ? '...' : displayEmail}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="" alt={displayName} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {isLoading ? (
                          <UserCog className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-semibold">{avatarFallback}</span>
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{isLoading ? 'Loading...' : displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{isLoading ? '...' : displayEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

