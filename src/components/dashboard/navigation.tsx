'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Briefcase, Music, UserCog, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const navItems = [
    { href: '/users', label: 'Users', icon: Users },
    { href: '/employees', label: 'Employees', icon: Briefcase },
    { href: '/djs', label: 'DJs', icon: Music },
];

export function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                toast({
                    title: 'Logged out',
                    description: 'You have been successfully logged out.',
                });
                router.push('/login');
                router.refresh();
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to logout',
                variant: 'destructive',
            });
        }
    };

    return (
        <nav className="border-b">
            <div className="container px-4 md:px-8">
                <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
                                        isActive
                                            ? "border-primary text-primary"
                                            : "border-transparent hover:text-primary"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <UserCog className="h-4 w-4 mr-2" />
                                Account
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    );
}
