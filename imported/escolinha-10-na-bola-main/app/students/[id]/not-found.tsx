import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Aluno não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O aluno que você está procurando não existe ou foi removido do sistema.
          </p>
          <Button asChild>
            <Link href="/students">Voltar para Lista de Alunos</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
