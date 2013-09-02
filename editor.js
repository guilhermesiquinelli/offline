var editor, statusline, savebutton, idletimer;

window.onload = function() {
	// Se for a primeira vez, inicializa o armazenamento local
	if (localStorage.note == null) { localStorage.note = ""; };
	if (localStorage.lastModified == null) { localStorage.lastModified = 0; };
	if (localStorage.lastSaved == null) { localStorage.lastSaved = 0; };

	// Localiza os elementos da interface do usuário
	editor = document.getElementById("editor");
	statusline = document.getElementById("statusline");
	savebutton = document.getElementById("savebutton");

	// Mostra anotação salva no editor
	editor.value = localStorage.note;

	// Desabilita edição até que sincronizemos
	editor.disaled = true;

	// Quando há entrada na textarea
	editor.addEventListener("input", function (e) {
		// Salva a nova anotação em localStorage
		localStorage.note = editor.value;
		localStorage.lastModified = Date.now();

		// Zera o timer de ociosidade
		if (idletimer) { clearTimeout(idletimer); };
		idletimer = setTimeout(save, 5000);

		// Habilita o botão salvar
		savebutton.disaled = false;
	}, false);

	// Tenta sincronizar com o servidor sempre que o arquivo é carregado
	sync();
};

// Salva no servidor antes de sair da página
window.onbeforeunload = function() {
	if (localStorage.lastModified > localStorage.lastSaved) {
		save();
	};
};

// Informa o usuário que estamos sem conexão
window.onoffline = function() { status("Offline"); };

// Quando a conexão volta, sincroniza
window.ononline = function() { sync(); };

// Notifica o usuário se houver uma nova versão desse aplicativo disponível.
// Podemos forçar o recarregamos da página com location.reload()
window.applicationCache.onupdateready = function() {
	status("Existe uma nova versão disponível, recarregue a página");
};

// Também permite que o usuário saiba quando não há uma nova versão disponível
window.applicationCache.onnoupdate = function() {
	status("Estamos usando a última versão");
};

// Função para exibir as mensagens de status
function status(msg) { statusline.innerHTML = msg; };


function save() {
	if (idletimer) { clearTimeout(idletimer) };
	idletimer = null;
	
	if (navigator.onLine) {
		$.ajax({
			type: 'POST',
			cache: false,
			data: {data: editor.value},
			url: 'note.php',
			success: function(data)
			{
				localStorage.lastSaved = Date.now();
				savebutton.disaled = true;
			}
		});
		/*
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "note.php");
		xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
		xhr.send(JSON.stringify({data:editor.value}));
		//xhr.send(editor.value);

		xhr.onload = function(e) {
			localStorage.lastSaved = Date.now();
			savebutton.disaled = true;
		};
		*/
	};
};

function sync() {
	if (navigator.onLine) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "note.txt");
		xhr.send();
		alert(xhr.getResponseHeader("Last-Modified"));
		xhr.onload = function() {
			var remoteModTime = 0;
			if (xhr.status == 200) {
				var remoteModTime = xhr.getResponseHeader("Last-Modified");
				remoteModTime = new Date(remoteModTime).getTime();
			};

			if (remoteModTime > localStorage.lastModified) {
				status("Novas anotações foram encontradas no servidor.");
				var useit = confirm("Existe uma nova versão no servidor, clique em ok para usa-la, ou em cancelar para continuar editando esta versão e sobreescrever a do servidor");
				var now = Date.now();
				if (useit) {
					editor.value = localStorage.note = xhr.responseText;
					localStorage.lastSaved = now;
					status("Nova versão carregada.");
				}
				else {
					status("Nova versão ignorada.");
					localStorage.lastModified = now;
				}
			}
			else {
				status("Você está editando a versão atual da anotação.");
			};

			if (localStorage.lastModified > localStorage.lastSaved) {
				save();
			};

			// Habilita o editor
			editor.disaled = false;
			editor.focus();
		};
	}
	else {
		status("Não podemos sincronizar enquanto estivermos offline.");
		editor.disaled = false;
		editor.focus();
	};
};