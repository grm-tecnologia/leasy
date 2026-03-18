import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function TermosPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <nav className="sticky top-0 z-50 h-14 border-b border-white/10 bg-[#0F0F0F]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-full flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-widest">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029580797/o2whmyWEnyg2xHJMbHxmnn/leasy-icon-square-6Ux6CtihddRwJ7iaPJ5QTp.webp"
              alt="Leasy"
              className="h-6 w-6 rounded"
            />
            <span className="text-sm font-medium text-white">Leasy</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest mb-4">Documento Legal</div>
          <h1 className="text-4xl font-light tracking-tight text-white mb-4">Termos de Uso</h1>
          <p className="text-sm text-zinc-500">Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Ao acessar e utilizar a plataforma Leasy ("Plataforma"), você concorda integralmente com estes Termos de Uso.
              Caso não concorde com qualquer disposição, não utilize nossos serviços. A utilização da Plataforma implica
              na aceitação automática destes termos, bem como da nossa Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">2. Descrição do Serviço</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A Leasy é uma plataforma de comercialização de listas de leads segmentados. Oferecemos dados de contatos
              comerciais organizados por categorias, com filtros avançados para segmentação. Os leads são verificados
              e tratados por inteligência artificial para garantir qualidade e relevância.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">3. Cadastro e Conta</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Para utilizar a Plataforma, é necessário criar uma conta por meio de autenticação OAuth 2.0.
              Você é responsável por manter a segurança de sua conta e por todas as atividades realizadas sob ela.
              Não compartilhe suas credenciais de acesso com terceiros. A Leasy reserva-se o direito de suspender
              ou encerrar contas que violem estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">4. Uso dos Dados Adquiridos</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Os leads adquiridos através da Plataforma devem ser utilizados exclusivamente para fins comerciais legítimos,
              em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). O usuário compromete-se a:
            </p>
            <ul className="text-sm text-zinc-400 list-disc pl-6 mt-3 space-y-2">
              <li>Não utilizar os dados para fins ilícitos, fraudulentos ou que violem a legislação vigente</li>
              <li>Não revender, redistribuir ou compartilhar os dados adquiridos com terceiros sem autorização</li>
              <li>Respeitar os direitos dos titulares dos dados, incluindo o direito de oposição e exclusão</li>
              <li>Manter registros de consentimento e base legal para o tratamento dos dados</li>
              <li>Não utilizar os dados para spam, assédio ou comunicações não solicitadas em massa</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">5. Pagamentos e Reembolsos</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Os pagamentos são processados de forma segura através do Mercado Pago. Após a confirmação do pagamento,
              os leads são disponibilizados para download em formato CSV. Devido à natureza digital e instantânea do produto,
              reembolsos serão avaliados caso a caso, considerando eventuais inconsistências nos dados entregues.
              Solicitações de reembolso devem ser feitas em até 7 dias após a compra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Todo o conteúdo da Plataforma, incluindo mas não limitado a textos, gráficos, logotipos, ícones,
              imagens, software e compilações de dados, é propriedade da Leasy ou de seus licenciadores e está
              protegido pelas leis de propriedade intelectual brasileiras e internacionais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A Leasy não garante que os dados dos leads estejam 100% atualizados ou livres de erros, embora
              empreguemos tecnologia de IA para verificação e enriquecimento contínuo. A Plataforma é fornecida
              "como está" e não nos responsabilizamos por resultados comerciais obtidos com o uso dos dados.
              Nossa responsabilidade total está limitada ao valor pago pelo usuário nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">8. Modificações dos Termos</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas
              serão comunicadas por e-mail ou notificação na Plataforma. O uso continuado após as modificações
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">9. Legislação Aplicável</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será
              submetida ao foro da comarca do domicílio do usuário, conforme previsto no Código de Defesa do Consumidor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">10. Contato</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Para dúvidas sobre estes Termos de Uso, entre em contato conosco através da plataforma
              ou pelo e-mail disponível na seção de suporte.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-[#0A0A0A] p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-[10px] font-mono tracking-widest uppercase text-zinc-600">
          <span>&copy; {new Date().getFullYear()} Leasy</span>
          <div className="flex gap-4">
            <a href="/termos" className="text-[#FF4500]/70">Termos</a>
            <a href="/privacidade" className="hover:text-zinc-400 transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  );
}
