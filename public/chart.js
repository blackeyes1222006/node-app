function getResponsiveFontSize() {
      const width = window.innerWidth;
      
      if (width > 1800) return 18;
      if (width > 1400) return 14;
      if (width > 1030) return 12;
      if (width > 1010) return 10;
      if (width > 768) return 14;
      
      return 12;
    }

    function getResponsiveDataLabelFontSize() {
      const width = window.innerWidth;
      
      if (width > 1800) return 14;
      if (width > 1400) return 10;
      if (width > 1200) return 8.5;
      if (width > 1030) return 10;
      if (width > 1010) return 10;
      if (width > 768) return 14;
      
      return 12;
    }
    async function fetchAndSetTitle() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const titleFromUrl = urlParams.get('title');

        if (titleFromUrl) {
          // Titulo diretamente da url
          document.getElementById('title_id').textContent = decodeURIComponent(titleFromUrl);
        } else {
          // Fallback para a API se não tiver nenhum título
          const baseUrl = window.location.origin;
          const response = await fetch(`${baseUrl}/api/title`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const { title } = await response.json();
          document.getElementById('title_id').textContent = title;
        }
      } catch (error) {
        console.error('Error setting title:', error);
        document.getElementById('title_id').textContent = 'CAMPUS POLITÉCNICO'; // Fallback title
      }
    }

      //gráfico fonte de energia
      function createEnergySourceChart(solarValue, redeValue) {
        const ctx = document.getElementById('ensource-chart').getContext('2d');
        
        const total = solarValue + redeValue;
        const solarPercent = Math.round((solarValue / total) * 100);
        const redePercent = Math.round((redeValue / total) * 100);

        energySourceChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Fontes de Energia'],
            datasets: [
              {
                label: 'Solar(%)',
                data: [solarPercent],
                backgroundColor: 'rgba(8,158,84,255)',
                borderRadius: 14,
                borderSkipped: false,
                barThickness: 40
              },
              {
                label: 'Rede(%)',
                data: [redePercent],
                backgroundColor: 'rgb(235,158,10)',
                borderRadius: 14,
                borderSkipped: false,
                barThickness: 40
              }
            ]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            onResize: function(chart) {
              chart.update();
            },
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                align: 'center',
                maxHeight: 40,
                padding: 10,
                labels: {
                  font: {
                    size: getResponsiveFontSize()
                  },
                  usePointStyle: true,
                  pointStyle: 'rectRounded'
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    return `${context.dataset.label}: ${value}%`;
                  }
                }
              },
              datalabels: {
                color: '#000',
                anchor: 'end',
                align: 'right',
                
                formatter: function(value) {
                  return value + '%';
                },
                font: {
                  size: getResponsiveDataLabelFontSize(),
                  family:"Open Sans, sans-serif",
                }
              }
            },
            scales: {
              x: {
                min: 0,
                max: 100,
                display: false,
                title: { display: false },
                grid: { display: false }
              },
              y: {
                display: false,
                grid: { display: false }
              }
            }
          },
          plugins: [ChartDataLabels] // Habilita o plugin
        });
      }

      let energySourceChart;

      function updateEnergySourceChart(solarValue, redeValue) {
        if (!energySourceChart) {
          createEnergySourceChart();
        }

        // calcula porcentagens
        const total = solarValue + redeValue;
        const solarPercent = Math.round((solarValue / total) * 100);
        const redePercent = Math.round((redeValue / total) * 100);

        // atualiza os dados do gráfico
        energySourceChart.data.datasets[0].data = [solarPercent];
        energySourceChart.data.datasets[1].data = [redePercent];
        energySourceChart.update();
      }

    // Cria os gráficos de CO2 e Energia
      let co2Chart, energiaChart;     

      async function createCO2Chart() {
        
        const endTs = new Date(new Date().getFullYear(), new Date().getMonth() + 1 , 0, 23, 59, 59, 999).getTime();
        const startTs = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).getTime();

        try {
          const [avoidedData, emittedData] = await Promise.all([
            getHistory('co2evitado', startTs, endTs),
            getHistory('co2emitido', startTs, endTs)
          ]);

          const avoided = processMonthlyData(avoidedData, 'co2evitado');
          const emitted = processMonthlyData(emittedData, 'co2emitido');

          const ctx = document.getElementById('chart-co2').getContext('2d');
          
          if (co2Chart) {
            co2Chart.data.labels = avoided.labels;
            co2Chart.data.datasets[0].data = avoided.values;
            co2Chart.data.datasets[1].data = emitted.values;
            co2Chart.update();
          } else {
            co2Chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: avoided.labels,
                datasets: [
                  {
                    label: 'CO₂ Evitado (ton)',
                    data: avoided.values, 
                    backgroundColor: 'rgb(150,218,158)',
                    borderColor: 'rgb(150,218,158)',
                    borderWidth: 1
                  },
                  {
                    label: 'CO₂ Emitido (ton)',
                    data: emitted.values, 
                    backgroundColor: 'rgb(235,158,10)',
                    borderColor:'rgb(235,158,10)',
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom',
                    labels: {
                      font: {
                        size: getResponsiveFontSize(),
                        family:"Open Sans, sans-serif",
                      },
                      usePointStyle: true,
                      pointStyle: 'rectRounded'
                    }
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false
                  }
                },
                scales: {
                  x: { 
                    stacked: true,
                    grid: { display: false }  
                  },
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Toneladas' },
                    grid: { display: false }  
                  }

                }
              }
            });
          }
        } catch (error) {
          console.error('Error creating CO2 chart:', error);
        }
      }

      

      async function createEnergiaChart() {

        const endTs = new Date(new Date().getFullYear(), new Date().getMonth() + 1 , 0, 23, 59, 59, 999).getTime();
        const startTs = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1).getTime();
       

        try {
          const [producedData, consumedData] = await Promise.all([
            getHistory('energiasolarconsumida', startTs, endTs),
            getHistory('energiaredeconsumida', startTs, endTs)
          ]);

          const produced = processMonthlyData(producedData, 'energiasolarconsumida');
          const consumed = processMonthlyData(consumedData, 'energiaredeconsumida');

          const ctx = document.getElementById('chart-energia').getContext('2d');
          
          if (energiaChart) {
            energiaChart.data.labels = produced.labels;
            energiaChart.data.datasets[0].data = produced.values;
            energiaChart.data.datasets[1].data = consumed.values;
            energiaChart.update();
          } else {
            energiaChart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: produced.labels,
                datasets: [
                  {
                    label: 'Energia Solar (kWh)',
                    data: produced.values,
                    backgroundColor: 'rgba(8,158,84,255)',
                    borderColor: 'rgba(8,158,84,255)',
                    borderWidth: 1
                  },
                  {
                    label: 'Energia Rede (kWh)',
                    data: consumed.values,
                    backgroundColor: 'rgb(235,158,10)',
                    borderColor: 'rgb(235,158,10)',
                    borderWidth: 1
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom',
                    labels: {
                      font: {
                        size: getResponsiveFontSize(),
                        family:"Open Sans, sans-serif",
                      },
                      usePointStyle: true,
                      pointStyle: 'rectRounded'
                    }
                   },
                  tooltip: {
                    mode: 'index',
                    intersect: false
                  }
                },
                scales: {
                  x: { 
                    stacked: true,
                    grid: { display: false }  
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: 'kWh' },
                    grid: { display: false }  
                  }
                }
              }
            });
          }
        } catch (error) {
          console.error('Error creating Energy chart:', error);
        }
      }

        //função que dá refresh nos gráficos de energia e CO2
    async function refreshHistory(retryCount = 0) {
        const maxRetries = 5;
        const retryDelay = 1000;

        try {
            console.log('Refreshing historical data...');
            const now = new Date();
            const endTs = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
            const startTs = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();

            const [avoidedData, emittedData, producedData, consumedData] = await Promise.all([
                getHistory('co2evitado', startTs, endTs),
                getHistory('co2emitido', startTs, endTs),
                getHistory('energiasolarconsumida', startTs, endTs),
                getHistory('energiaredeconsumida', startTs, endTs)
            ]);

            const avoided = processMonthlyData(avoidedData, 'co2evitado');
            const emitted = processMonthlyData(emittedData, 'co2emitido');
            const produced = processMonthlyData(producedData, 'energiasolarconsumida');
            const consumed = processMonthlyData(consumedData, 'energiaredeconsumida');

            if (co2Chart) {
                co2Chart.data.labels = avoided.labels;
                co2Chart.data.datasets[0].data = avoided.values;
                co2Chart.data.datasets[1].data = emitted.values;
                co2Chart.update();
            }

            if (energiaChart) {
                energiaChart.data.labels = produced.labels;
                energiaChart.data.datasets[0].data = produced.values;
                energiaChart.data.datasets[1].data = consumed.values;
                energiaChart.update();
            }

        } catch (error) {
            console.error('Error refreshing historical data:', error);

            if (retryCount < maxRetries) {
                console.log(`Retrying refreshHistory in ${retryDelay / 1000}s... (${retryCount + 1}/${maxRetries})`);
                setTimeout(() => refreshHistory(retryCount + 1), retryDelay);
            } else {
                console.error('Max retry limit reached. Could not refresh historical data.');
            }
        }
        }


        // DOMContentLoaded event que inicializa os gráficos e dados
        document.addEventListener("DOMContentLoaded", async () => {
            document.getElementById("currentDate").textContent = moment().format('DD/MM/YYYY');
            await fetchAndSetTitle();
            await createCO2Chart();
            await createEnergiaChart();
            refreshHistory();
            
        });

        window.addEventListener('error', (event) => {
        if (event.message.includes('500') || event.message.includes('Failed to authenticate')) {
            console.warn('Global error detected, retrying refresh...');
            refreshHistory();
        }
        });

        window.addEventListener('resize', () => {
          if (co2Chart) co2Chart.options.plugins.legend.labels.font.size = getResponsiveFontSize();
          if (energiaChart) energiaChart.options.plugins.legend.labels.font.size = getResponsiveFontSize();
          if (energySourceChart) energySourceChart.options.plugins.legend.labels.font.size = getResponsiveFontSize();

          if (co2Chart) co2Chart.update();
          if (energiaChart) energiaChart.update();
          if (energySourceChart) energySourceChart.update();
        });
