NPM ?= npm
PORT ?= 8000
HOST ?= 0.0.0.0
IP ?= $(shell ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $$1}')

.DEFAULT_GOAL := help
.PHONY: help check-node install build run start dev dev-api dev-ui check test audit urls clean backup

help:
	@echo 'StageZero'
	@echo '  make install   Instalar dependências dos lockfiles'
	@echo '  make run       Compilar e iniciar o evento na rede local'
	@echo '  make start     Servir a compilação existente'
	@echo '  make urls      Mostrar endereços do Display e do Controlador'
	@echo '  make dev       Iniciar API e frontend de desenvolvimento'
	@echo '  make check     Verificar TypeScript e compilar'
	@echo '  make test      Testar regras, API, tempo real e persistência'
	@echo '  make audit     Auditar todas as dependências npm'
	@echo '  make backup    Copiar a base de dados com o servidor parado'
	@echo '  make clean     Remover apenas os ficheiros compilados'

check-node:
	@node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) { console.error("StageZero requer Node.js 22.13+ (recomendado Node 24 LTS). Versão atual: " + process.version); process.exit(1); }'

install: check-node
	$(NPM) --prefix backend ci
	$(NPM) --prefix frontend ci

build: check-node
	$(NPM) --prefix backend run build
	$(NPM) --prefix frontend run build

run: build
	$(MAKE) start

start: check-node
	@test -f frontend/dist/index.html && test -f backend/dist/main.js || { echo 'Executa make run para compilar primeiro.'; exit 1; }
	@$(MAKE) urls
	PORT=$(PORT) HOST=$(HOST) $(NPM) --prefix backend start

urls:
	@echo 'Display no computador   http://localhost:$(PORT)/display'
	@if [ -n "$(IP)" ]; then echo 'Controlador na rede     http://$(IP):$(PORT)/controller'; else echo 'Controlador na rede     http://IP_DO_COMPUTADOR:$(PORT)/controller'; fi

dev: check-node
	@$(MAKE) -j2 dev-api dev-ui

dev-api:
	HOST=127.0.0.1 PORT=8000 $(NPM) --prefix backend run dev

dev-ui:
	$(NPM) --prefix frontend run dev

check: build

test: check
	$(NPM) --prefix backend test

audit:
	@status=0; $(NPM) --prefix backend audit || status=1; $(NPM) --prefix frontend audit || status=1; exit $$status

backup:
	@test -f data/stagezero.sqlite || { echo 'Ainda não existe uma base de dados local.'; exit 1; }
	@mkdir -p data/backups
	@backup=data/backups/stagezero-$$(date +%Y%m%d-%H%M%S).sqlite; \
	sqlite3 data/stagezero.sqlite ".backup '$$backup'" && echo "$$backup"

clean:
	rm -rf frontend/dist backend/dist
