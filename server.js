const express = require('express');
const client = require('prom-client');

const app = express();

const register = new client.Registry();

// 1) Métricas padrão do Node/Process
client.collectDefaultMetrics({ register, prefix: 'app_' });

// 2) MÉTRICAS CUSTOMIZADAS
// (A) Counter de requisições
const requestsTotal = new client.Counter({
  name: 'app_requests_total',
  help: 'Contador de requisições recebidas',
});
register.registerMetric(requestsTotal);

// (B) Histograma de latência HTTP
const httpRequestDuration = new client.Histogram({
  name: 'app_http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});
register.registerMetric(httpRequestDuration);

// 3) Middleware para medir latência por rota
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method, route: req.path });
  res.on('finish', () => end({ code: res.statusCode }));
  next();
});

app.get('/', (req, res) => {
  requestsTotal.inc();
  res.send('Hello, Prometheus + Grafana + Kubernetes!');
});
s
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
