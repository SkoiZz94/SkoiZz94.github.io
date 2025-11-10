const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", 
    "Junho", "Julho", "Agosto", "Setembro", "Outubro", 
    "Novembro", "Dezembro"
];

async function fetchWeekdayHolidays(year, month) {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PT`);
    if (response.ok) {
        const holidays = await response.json();
        // Filter holidays that are in the specified month, fall on weekdays, and are national (no 'counties' field)
        return holidays.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            const isCorrectMonth = holidayDate.getMonth() + 1 === month;
            const isWeekday = holidayDate.getDay() > 0 && holidayDate.getDay() < 6; // Only weekdays
            const isNational = !holiday.counties; // Exclude subdivision-specific holidays
            return isCorrectMonth && isWeekday && isNational;
        });
    } else {
        console.error('Erro ao buscar feriados');
        return [];
    }
}

document.getElementById('holidayForm').onsubmit = async function (e) {
    e.preventDefault(); // Prevent form from submitting normally

    const mes = parseInt(document.getElementById('month').value);
    const diasFerias = parseInt(document.getElementById('vacation_days').value);
    const diasPresentes = parseInt(document.getElementById('work_days').value);
    const ano = new Date().getFullYear() + (mes < new Date().getMonth() + 1 ? 1 : 0);

    // Get all weekdays in the month
    const totalDiasDeSemana = contarDiasDeSemana(mes, ano);

    // Fetch holidays on weekdays
    const feriados = await fetchWeekdayHolidays(ano, mes);

    // Calculate available workdays excluding holidays and vacation days
    const totalDiasDisponiveis = totalDiasDeSemana - diasFerias - feriados.length;

    // Calculate score
    const pontuacao = totalDiasDisponiveis > 0 ? (diasPresentes / totalDiasDisponiveis) * 5 : 0;

    // Determine score color
    let scoreColor;
    if (pontuacao < 2) {
        scoreColor = 'red';
    } else if (pontuacao <= 3) {
        scoreColor = 'yellow';
    } else {
        scoreColor = 'green';
    }

    // Display results with holiday details and month name
    const feriadosListados = feriados.map(feriado => 
        `<li>${new Date(feriado.date).toLocaleDateString('pt-BR')}: ${feriado.localName}</li>`
    ).join("");
    
    let resultHtml = `
        <span>Total de dias úteis no mês de ${monthNames[mes - 1]} de ${ano}:</span> ${totalDiasDeSemana}<br>
        <span>Feriados em dias úteis: ${feriados.length}</span><br>
        <ul>${feriadosListados}</ul>
        <span>Total de dias disponíveis para trabalho:</span> ${totalDiasDisponiveis}<br>
        <br>
        <span class="bold">Pontuação calculada: <span class="score" style="color: ${scoreColor};">${pontuacao.toFixed(2)}</span></span>
    `;
    
    document.getElementById('results').innerHTML = resultHtml;
};

// Function to count weekdays in a month
function contarDiasDeSemana(mes, ano) {
    let diasDeSemana = 0;
    const totalDiasNoMes = new Date(ano, mes, 0).getDate();
    
    for (let dia = 1; dia <= totalDiasNoMes; dia++) {
        const dataAtual = new Date(ano, mes - 1, dia);
        const diaDaSemana = dataAtual.getDay();
        
        if (diaDaSemana > 0 && diaDaSemana < 6) {
            diasDeSemana++;
        }
    }
    return diasDeSemana;
}
