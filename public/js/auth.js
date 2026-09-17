const form = document.getElementById('authForm');
const nomeGroup = document.getElementById('nomeGroup');
const nomeInput = document.getElementById('authNome');
const emailInput = document.getElementById('authEmail');
const senhaInput = document.getElementById('authSenha');
const mensagem = document.getElementById('authMensagem');
const submit = document.getElementById('authSubmit');
const tabs = document.querySelectorAll('.auth-tab');
let modo = 'login';

fetch('/api/auth/me').then((resp) => {
  if (resp.ok) window.location.replace('/app');
});

tabs.forEach((tab) => tab.addEventListener('click', () => {
  modo = tab.dataset.mode;
  tabs.forEach((item) => item.classList.toggle('active', item === tab));
  nomeGroup.classList.toggle('hidden', modo === 'login');
  nomeInput.required = modo === 'register';
  senhaInput.autocomplete = modo === 'login' ? 'current-password' : 'new-password';
  submit.textContent = modo === 'login' ? 'Entrar no sistema' : 'Criar conta';
  mensagem.classList.add('hidden');
}));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submit.disabled = true;
  mensagem.classList.add('hidden');
  const dados = { email: emailInput.value.trim(), senha: senhaInput.value };
  if (modo === 'register') dados.nome = nomeInput.value.trim();

  try {
    const resp = await fetch(`/api/auth/${modo}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados),
    });
    const resposta = await resp.json();
    if (!resp.ok) throw new Error(resposta.error || 'Nao foi possivel autenticar.');
    window.location.replace('/app');
  } catch (erro) {
    mensagem.textContent = erro.message;
    mensagem.classList.remove('hidden');
  } finally {
    submit.disabled = false;
  }
});
