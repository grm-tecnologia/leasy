import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacidadePage() {
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
          <h1 className="text-4xl font-light tracking-tight text-white mb-4">Política de Privacidade</h1>
          <p className="text-sm text-zinc-500">Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">1. Introdução</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A Leasy ("nós", "nosso") está comprometida com a proteção da privacidade dos seus usuários.
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas
              informações pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais
              (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">2. Dados que Coletamos</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Coletamos os seguintes tipos de dados pessoais:
            </p>
            <div className="bg-[#050505] border border-white/10 p-4 rounded-lg space-y-3">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF4500] mb-1">Dados de Cadastro</h4>
                <p className="text-sm text-zinc-400">Nome, endereço de e-mail e método de autenticação (Google, e-mail, etc.), obtidos via OAuth 2.0.</p>
              </div>
              <div className="border-t border-white/5 pt-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF4500] mb-1">Dados de Uso</h4>
                <p className="text-sm text-zinc-400">Informações sobre como você interage com a Plataforma, incluindo páginas visitadas, buscas realizadas, categorias exploradas e compras efetuadas.</p>
              </div>
              <div className="border-t border-white/5 pt-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF4500] mb-1">Dados de Pagamento</h4>
                <p className="text-sm text-zinc-400">Informações de transação processadas pelo Mercado Pago. Não armazenamos dados de cartão de crédito ou informações financeiras sensíveis.</p>
              </div>
              <div className="border-t border-white/5 pt-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF4500] mb-1">Cookies e Dados Técnicos</h4>
                <p className="text-sm text-zinc-400">Cookies de sessão para autenticação, endereço IP, tipo de navegador e sistema operacional para fins de segurança e melhoria do serviço.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">3. Base Legal para Tratamento</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:
            </p>
            <ul className="text-sm text-zinc-400 list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-zinc-300">Execução de contrato</strong> (Art. 7º, V): para prestação dos serviços contratados</li>
              <li><strong className="text-zinc-300">Consentimento</strong> (Art. 7º, I): para envio de comunicações de marketing</li>
              <li><strong className="text-zinc-300">Legítimo interesse</strong> (Art. 7º, IX): para melhoria dos serviços e segurança da plataforma</li>
              <li><strong className="text-zinc-300">Cumprimento de obrigação legal</strong> (Art. 7º, II): para atender exigências regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">4. Finalidades do Tratamento</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Utilizamos seus dados pessoais para:
            </p>
            <ul className="text-sm text-zinc-400 list-disc pl-6 mt-3 space-y-2">
              <li>Fornecer e manter os serviços da Plataforma</li>
              <li>Processar pagamentos e gerenciar pedidos</li>
              <li>Personalizar sua experiência na Plataforma</li>
              <li>Enviar notificações sobre pedidos e atualizações do serviço</li>
              <li>Garantir a segurança da Plataforma e prevenir fraudes</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Melhorar nossos serviços por meio de análises agregadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">5. Compartilhamento de Dados</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Seus dados pessoais podem ser compartilhados com:
            </p>
            <ul className="text-sm text-zinc-400 list-disc pl-6 mt-3 space-y-2">
              <li><strong className="text-zinc-300">Mercado Pago</strong>: para processamento de pagamentos</li>
              <li><strong className="text-zinc-300">Provedores de infraestrutura</strong>: para hospedagem e armazenamento seguro de dados</li>
              <li><strong className="text-zinc-300">Autoridades competentes</strong>: quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="text-sm text-zinc-400 leading-relaxed mt-3">
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">6. Segurança dos Dados</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo:
            </p>
            <ul className="text-sm text-zinc-400 list-disc pl-6 mt-3 space-y-2">
              <li>Criptografia de dados em trânsito (TLS/SSL)</li>
              <li>Autenticação segura via OAuth 2.0 com tokens JWT</li>
              <li>Cookies HttpOnly e Secure para proteção de sessão</li>
              <li>Rate limiting para prevenção de ataques de força bruta</li>
              <li>Sanitização de inputs para prevenção de injeção de código</li>
              <li>Headers de segurança HTTP (CSP, X-Frame-Options, etc.)</li>
              <li>Monitoramento contínuo de atividades suspeitas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">7. Seus Direitos (LGPD)</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Conforme a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: "Confirmação", desc: "Confirmar a existência de tratamento dos seus dados" },
                { title: "Acesso", desc: "Acessar seus dados pessoais tratados por nós" },
                { title: "Correção", desc: "Corrigir dados incompletos, inexatos ou desatualizados" },
                { title: "Anonimização", desc: "Solicitar anonimização ou bloqueio de dados desnecessários" },
                { title: "Portabilidade", desc: "Solicitar portabilidade dos dados a outro fornecedor" },
                { title: "Eliminação", desc: "Solicitar eliminação dos dados tratados com consentimento" },
                { title: "Revogação", desc: "Revogar consentimento a qualquer momento" },
                { title: "Oposição", desc: "Opor-se ao tratamento em caso de descumprimento da LGPD" },
              ].map((right) => (
                <div key={right.title} className="bg-[#050505] border border-white/5 p-3 rounded">
                  <h4 className="text-xs font-medium text-white mb-1">{right.title}</h4>
                  <p className="text-[11px] text-zinc-500">{right.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">8. Cookies</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento da Plataforma, incluindo cookies de sessão
              para autenticação. Estes cookies são estritamente necessários e não podem ser desativados.
              Não utilizamos cookies de rastreamento de terceiros para fins publicitários.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">9. Retenção de Dados</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Seus dados pessoais são retidos pelo tempo necessário para cumprir as finalidades descritas nesta
              política, ou conforme exigido por lei. Dados de conta são mantidos enquanto sua conta estiver ativa.
              Após solicitação de exclusão, seus dados serão removidos em até 30 dias, exceto quando houver
              obrigação legal de retenção.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">10. Encarregado de Dados (DPO)</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento de dados pessoais,
              entre em contato com nosso Encarregado de Proteção de Dados através da plataforma
              ou pelo e-mail disponível na seção de suporte.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-light text-white border-l-2 border-[#FF4500] pl-4 mb-4">11. Alterações nesta Política</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos sobre alterações
              significativas por e-mail ou notificação na Plataforma. Recomendamos a revisão periódica deste documento.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-[#0A0A0A] p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-[10px] font-mono tracking-widest uppercase text-zinc-600">
          <span>&copy; {new Date().getFullYear()} Leasy</span>
          <div className="flex gap-4">
            <a href="/termos" className="hover:text-zinc-400 transition-colors">Termos</a>
            <a href="/privacidade" className="text-[#FF4500]/70">Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  );
}
