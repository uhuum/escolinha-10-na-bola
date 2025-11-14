"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Users, AlertCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { login } = useAuth()
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState<"admin" | "coach" | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRole) return

    setIsLoading(true)

    try {
      const success = await login(username, password)

      if (success) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${username}!`,
        })
      } else {
        toast({
          title: "Erro ao fazer login",
          description: "Usuário ou senha incorretos. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>

        <div className="w-full max-w-5xl relative z-10">
          <div className="text-center mb-8 sm:mb-12">
            <div className="relative h-24 w-24 sm:h-32 sm:w-32 mx-auto mb-6 sm:mb-8">
              <Image src="/logo-ceap.png" alt="Logo CEAP" fill className="object-contain drop-shadow-2xl" priority />
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-2 sm:mb-4 tracking-tight">SIGA</h1>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-red-500 mx-auto mb-6" />
            <p className="text-xl sm:text-2xl text-blue-100 px-4 font-semibold">
              Sistema Integrado de Gestão de Alunos
            </p>
            <p className="text-base sm:text-lg text-slate-300 mt-2 px-4">Centro de Educação Além da Educação - CEAP</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 px-2 sm:px-0">
            <Card
              className="border-0 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl hover:from-white hover:to-white/95 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 group"
              onClick={() => setSelectedRole("admin")}
            >
              <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-2xl transition-all">
                  <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl text-blue-900">Administrativo</CardTitle>
                <CardDescription className="text-sm sm:text-base">Acesso completo ao sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Gerenciar alunos e turmas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Pagamentos e relatórios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Controle total do sistema
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="border-0 bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl hover:from-white hover:to-white/95 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 group"
              onClick={() => setSelectedRole("coach")}
            >
              <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-2xl transition-all">
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl text-blue-900">Treinadores</CardTitle>
                <CardDescription className="text-sm sm:text-base">Gestão de turmas e alunos</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                    Visualizar alunos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                    Registrar chamadas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                    Relatórios de presença
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-0 bg-white/95 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-4 sm:mb-6">
            <Image src="/logo-ceap.png" alt="Logo CEAP" fill className="object-contain drop-shadow-lg" priority />
          </div>
          <CardTitle className="text-2xl sm:text-3xl text-blue-900">
            Login - {selectedRole === "admin" ? "Administrativo" : "Treinadores"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Entre com suas credenciais para acessar</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                className="h-10 sm:h-11 border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="h-10 sm:h-11 border-2"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-blue-800">
                <p className="font-medium mb-1"></p>
                <p className="text-xs">
                  <code className="font-mono bg-blue-100 px-1"></code> /{" "}
                  <code className="font-mono bg-blue-100 px-1"></code>
                </p>
                <p className="text-xs">
                  <code className="font-mono bg-blue-100 px-1"></code> /{" "}
                  <code className="font-mono bg-blue-100 px-1"></code>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-white h-10 sm:h-11 border-2 flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedRole(null)
                  setUsername("")
                  setPassword("")
                }}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 sm:h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
