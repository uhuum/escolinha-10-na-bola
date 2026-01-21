"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Users, ArrowLeft } from "lucide-react"
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
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full" />
        </div>

        {/* Decorative Lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <div className="absolute bottom-20 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
        </div>

        <div className="w-full max-w-5xl relative z-10">
          {/* Logo and Title */}
          <div className="text-center mb-10 sm:mb-14">
            <div className="relative h-28 w-28 sm:h-36 sm:w-36 mx-auto mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-red-500/20 rounded-full blur-xl" />
              <Image
                src="/logo-ceap.png"
                alt="Logo CEAP"
                fill
                className="object-contain drop-shadow-2xl relative z-10"
                priority
              />
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-3 sm:mb-4 tracking-tight">SIGA</h1>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-1 bg-gradient-to-r from-transparent to-blue-500 rounded-full" />
              <div className="w-3 h-3 bg-white rounded-full" />
              <div className="w-16 h-1 bg-gradient-to-l from-transparent to-red-500 rounded-full" />
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 px-4 font-semibold tracking-wide">
              Sistema Integrado de Gestão de Alunos
            </p>
            <p className="text-base sm:text-lg text-blue-200/70 mt-3 px-4">Escola de Futebol 10 Na Bola</p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 px-2 sm:px-0">
            {/* Admin Card */}
            <Card
              className="border-0 bg-white/[0.03] backdrop-blur-xl cursor-pointer transition-all duration-500 hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98] group overflow-hidden relative"
              onClick={() => setSelectedRole("admin")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-blue-600/0 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <CardHeader className="text-center pb-4 sm:pb-6 p-5 sm:p-8 relative z-10">
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 mx-auto mb-5 sm:mb-7 shadow-lg shadow-blue-500/30 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:scale-110">
                  <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl text-white font-bold">Administrativo</CardTitle>
                <CardDescription className="text-base sm:text-lg text-blue-200/60">
                  Acesso completo ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-8 pt-0 relative z-10">
                <ul className="space-y-3 text-sm sm:text-base text-white/70">
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                    Gerenciar alunos e turmas
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                    Pagamentos e relatórios
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                    Controle total do sistema
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Trainer Card */}
            <Card
              className="border-0 bg-white/[0.03] backdrop-blur-xl cursor-pointer transition-all duration-500 hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98] group overflow-hidden relative"
              onClick={() => setSelectedRole("coach")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/0 via-red-600/0 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <CardHeader className="text-center pb-4 sm:pb-6 p-5 sm:p-8 relative z-10">
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 mx-auto mb-5 sm:mb-7 shadow-lg shadow-red-500/30 group-hover:shadow-2xl group-hover:shadow-red-500/40 transition-all duration-500 group-hover:scale-110">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl text-white font-bold">Treinadores</CardTitle>
                <CardDescription className="text-base sm:text-lg text-red-200/60">
                  Gestão de turmas e alunos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 sm:p-8 pt-0 relative z-10">
                <ul className="space-y-3 text-sm sm:text-base text-white/70">
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                    Visualizar alunos
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                    Registrar chamadas
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                    Relatórios de presença
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <p className="text-center text-white/30 text-sm mt-10">© 2025 SIGA - Todos os direitos reservados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-0 bg-white/[0.03] backdrop-blur-xl shadow-2xl relative z-10 overflow-hidden">
        <div
          className={`absolute top-0 left-0 w-full h-1 ${selectedRole === "admin" ? "bg-gradient-to-r from-blue-600 to-blue-400" : "bg-gradient-to-r from-red-600 to-orange-400"}`}
        />

        <CardHeader className="text-center p-5 sm:p-8">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-5 sm:mb-6">
            <div
              className={`absolute inset-0 ${selectedRole === "admin" ? "bg-blue-500/20" : "bg-red-500/20"} rounded-full blur-xl`}
            />
            <Image
              src="/logo-ceap.png"
              alt="Logo CEAP"
              fill
              className="object-contain drop-shadow-lg relative z-10"
              priority
            />
          </div>
          <CardTitle className="text-2xl sm:text-3xl text-white font-bold">
            {selectedRole === "admin" ? "Administrativo" : "Treinadores"}
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-white/60">
            Entre com suas credenciais para acessar
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-8 pt-0">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-white/80">
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
                className="h-11 sm:h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/30 focus:bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-white/80">
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
                className="h-11 sm:h-12 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-white/30 focus:bg-white/10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 sm:h-12 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedRole(null)
                  setUsername("")
                  setPassword("")
                }}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button
                type="submit"
                className={`flex-1 h-11 sm:h-12 text-white font-semibold ${
                  selectedRole === "admin"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                }`}
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
