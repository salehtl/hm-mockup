.PHONY: setup start test fmt lint clean
setup:
	[ -f package.json ] && npm ci || true

start:
	[ -f package.json ] && npm run dev || true

test:
	[ -f package.json ] && npm test || true

fmt:
	[ -f package.json ] && npm run fmt || true

lint:
	[ -f package.json ] && npm run lint || true

clean:
	rm -rf node_modules .cache dist 2>/dev/null || true