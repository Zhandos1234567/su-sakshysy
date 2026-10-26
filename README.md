# Су сақшысы — Full-Stack Water Intelligence

Қазақ тіліндегі су тұтыну трекері. React + Vite интерфейсі, Express REST API және PostgreSQL-ға арналған schema.

## Функциялар
- Жаңартылған responsive dashboard дизайны.
- Су қосу: +250, +500, +1000 мл және қолмен енгізу.
- Күндік мақсатты өзгерту, прогресс пен жетістік индикаторы.
- Бүгінгі енгізулер тарихы.
- Браузердің `localStorage` қоймасына сақтау.
- Backend health check, өңірлердің demo endpoint-і, күндік су есебін синхрондау endpoint-і.
- PostgreSQL кестелері және соңғы күндер бойынша summary endpoint.
- Кездейсоқ кеңес — алдын ала жазылған демонстрациялық кеңестер, нақты AI емес.

## Талаптар
- Node.js 18 немесе одан жоғары
- (Қосымша) PostgreSQL

## Орнату
```bash
npm install
cp .env.example .env
```
Windows PowerShell қолдансаң:
```powershell
Copy-Item .env.example .env
```

`.env` ішіндегі `JWT_SECRET` мәнін өзгертіп, қажет болса `DATABASE_URL` орнат.

## Іске қосу — frontend демо
1. Бір терминалда:
```bash
npm run dev
```
2. Браузерде Vite көрсеткен URL-ды аш (әдетте `http://localhost:5173`).

Backend health check қосылуы үшін екінші терминалда:
```bash
npm run server
```
Содан соң `/api/health` endpoint-і `http://localhost:3000/api/health` адресінде қолжетімді болады.

## PostgreSQL қосу
1. PostgreSQL ішінде `su_saqshysy` дерекқорын жаса.
2. `server/schema.sql` файлын сол дерекқорға орында.
3. `.env` ішіне өзіңнің жергілікті қосылым жолыңды жаз:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/su_saqshysy
JWT_SECRET=ұзын-кездейсоқ-құпия-мән
CLIENT_ORIGIN=http://localhost:5173
```
4. Backend-ті қайта іске қос. `/api/health` дерекқор күйін көрсетеді.
5. Трекердегі «Backend-ке синхрондау» батырмасын пайдалан.

**Ескерту:** `water_events` кестесіне әр синхрондау кезінде жіберілген оқиғалар жаңадан жазылады; бір есепті қайта-қайта синхрондау оқиғаларды қайталауы мүмкін. Өндірістік нұсқада event ID/idempotency механизмі және пайдаланушы аккаунтына байланыс қосу керек.

## API
- `GET /api/health` — API және дерекқор күйі.
- `GET /api/regions` — demo өңірлік индекстері.
- `POST /api/water/logs` — күндік есеп пен оқиғаларды сақтау.
- `GET /api/water/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` — сақталған күндер.
- `POST /api/demo-token` — оқу мақсатындағы JWT токені. Нақты аутентификация емес.

### Синхрондау сұранысының мысалы
```json
{
  "date": "2026-10-26",
  "amount": 1250,
  "goal": 2000,
  "logs": [
    { "amount": 250, "time": "2026-10-26T08:30:00.000Z" },
    { "amount": 1000, "time": "2026-10-26T12:10:00.000Z" }
  ]
}
```

## Production туралы
Бұл — оқу портфолиосына арналған starter project. Қоғамдық серверге шығар алдында нақты пайдаланушы тіркелуі/кіруі, құпиясөзді bcrypt арқылы хэштеу, JWT қорғанысын маршруттарға қолдану, rate limiting, енгізулерді терең тексеру, құпияларды environment variables арқылы басқару және ресми деректер көзі бар өңірлік статистика қажет. Демонстрациялық өңірлік пайыздарды ресми дерек ретінде көрсетпе.
