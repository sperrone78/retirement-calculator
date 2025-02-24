// Add these global variables at the top of the file
let networthChart = null;
let incomeChart = null;
let withdrawalChart = null;

function validateInputs() {
    const inputs = document.querySelectorAll('input[type="number"]');
    let isValid = true;
    
    inputs.forEach(input => {
        // Remove any previous error styling
        input.classList.remove('input-error');
        
        const value = Number(input.value);
        
        // Check if input is empty or not a number
        if (input.value === '' || isNaN(value)) {
            input.classList.add('input-error');
            isValid = false;
            return;
        }
        
        // Check for negative values where inappropriate
        if (value < 0 && !input.classList.contains('allow-negative')) {
            input.classList.add('input-error');
            isValid = false;
            return;
        }
        
        // Specific validations
        if (input.id === 'retirementAge' && value <= Number(document.getElementById('currentAge').value)) {
            input.classList.add('input-error');
            isValid = false;
        }
        
        if (input.id === 'lifeExpectancy' && value <= Number(document.getElementById('retirementAge').value)) {
            input.classList.add('input-error');
            isValid = false;
        }
        
        // Validate allocation percentages sum to 100%
        if (input.id === 'stockAllocation' || input.id === 'bondAllocation') {
            const stockAllocation = Number(document.getElementById('stockAllocation').value);
            const bondAllocation = Number(document.getElementById('bondAllocation').value);
            
            if (stockAllocation + bondAllocation !== 100) {
                document.getElementById('stockAllocation').classList.add('input-error');
                document.getElementById('bondAllocation').classList.add('input-error');
                isValid = false;
            }
        }
    });
    
    return isValid;
}

function calculateRetirement() {
    // Validate inputs before calculating
    if (!validateInputs()) {
        // Show error message
        alert('Please correct the highlighted input errors before calculating.');
        return;
    }
    
    const inputs = getInputs();
    const years = [];
    const networthData = [];
    const incomeData = [];
    const withdrawalData = [];
    
    // Track accounts separately
    let traditionalBalance = inputs.traditional401k + inputs.traditionalIRA;
    let rothBalance = inputs.roth401k + inputs.rothIRA;
    let taxableBalance = inputs.currentSavings;
    let currentNetworth = traditionalBalance + rothBalance + taxableBalance;
    let currentSalary = inputs.currentSalary;
    const blendedReturn = inputs.expectedReturn / 100;

    // Year-by-year calculations
    for (let age = inputs.currentAge; age <= inputs.lifeExpectancy; age++) {
        years.push(age);
        
        // Pre-retirement phase
        if (age < inputs.retirementAge) {
            // Increase salary with inflation
            currentSalary *= (1 + inputs.salaryIncrease);
            
            // Add annual savings and investment returns
            traditionalBalance = traditionalBalance * (1 + blendedReturn) + 
                inputs.traditional401kContrib + inputs.employerContribution;
            rothBalance = rothBalance * (1 + blendedReturn) + 
                inputs.roth401kContrib + inputs.iraContrib;
            taxableBalance = taxableBalance * (1 + blendedReturn) + 
                inputs.annualSavings;
            
            currentNetworth = traditionalBalance + rothBalance + taxableBalance;
            networthData.push(currentNetworth);
            incomeData.push(currentSalary);
            withdrawalData.push(0);
        } 
        // Retirement phase
        else {
            let annualIncome = 0;
            let withdrawal = 0;
            
            // Calculate Social Security and pension income
            if (age >= inputs.ssBenefitAge) {
                const ssAdjustment = calculateSocialSecurityAdjustment(inputs.ssBenefitAge);
                annualIncome += inputs.ssMonthlyBenefit * 12 * ssAdjustment;
            }
            if (age >= inputs.pensionAge) {
                annualIncome += inputs.pensionAmount * 12;
            }
            
            // Calculate required withdrawal for desired income
            const incomeNeeded = inputs.desiredIncome * 
                Math.pow(1 + inputs.inflationRate, age - inputs.retirementAge);
            withdrawal = Math.max(0, incomeNeeded - annualIncome);
            
            // Calculate RMD from traditional accounts only
            const rmd = calculateRMD(age, traditionalBalance);
            
            // Take withdrawals first from RMD if required
            let remainingWithdrawal = withdrawal;
            if (rmd > 0) {
                const rmdWithdrawal = Math.min(rmd, traditionalBalance);
                traditionalBalance -= rmdWithdrawal;
                remainingWithdrawal = Math.max(0, withdrawal - rmdWithdrawal);
            }
            
            // Then take remaining withdrawals from accounts in tax-efficient order
            if (remainingWithdrawal > 0) {
                // First from taxable
                const taxableWithdrawal = Math.min(remainingWithdrawal, taxableBalance);
                taxableBalance -= taxableWithdrawal;
                remainingWithdrawal -= taxableWithdrawal;
                
                // Then from traditional
                const traditionalWithdrawal = Math.min(remainingWithdrawal, traditionalBalance);
                traditionalBalance -= traditionalWithdrawal;
                remainingWithdrawal -= traditionalWithdrawal;
                
                // Finally from Roth
                const rothWithdrawal = Math.min(remainingWithdrawal, rothBalance);
                rothBalance -= rothWithdrawal;
            }
            
            // Apply investment returns
            traditionalBalance *= (1 + blendedReturn);
            rothBalance *= (1 + blendedReturn);
            taxableBalance *= (1 + blendedReturn);
            
            currentNetworth = traditionalBalance + rothBalance + taxableBalance;
            networthData.push(Math.max(0, currentNetworth));
            incomeData.push(annualIncome + withdrawal);
            withdrawalData.push(withdrawal);
        }
    }

    updateCharts(years, networthData, incomeData, withdrawalData);
    updateSummaryStats(networthData, incomeData, inputs);
}

function updateCharts(years, networthData, incomeData, withdrawalData) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#ffffff' : '#666666';
    const gridColor = isDarkMode ? '#4d4d4d' : '#ddd';
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: textColor
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: gridColor
                },
                ticks: {
                    color: textColor,
                    callback: value => '$' + value.toLocaleString()
                }
            }
        },
        plugins: {
            title: {
                color: textColor,
                display: true
            },
            legend: {
                labels: {
                    color: textColor
                }
            }
        }
    };

    // If charts already exist, update them instead of destroying and recreating
    if (networthChart) {
        networthChart.data.labels = years;
        networthChart.data.datasets[0].data = networthData;
        networthChart.options = chartOptions;
        networthChart.update();
    } else {
        // Create Networth Chart
        networthChart = new Chart(document.getElementById('networthChart'), {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Net Worth',
                    data: networthData,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: chartOptions
        });
    }

    // Similar approach for other charts
    if (incomeChart) {
        incomeChart.data.labels = years;
        incomeChart.data.datasets[0].data = incomeData;
        incomeChart.options = chartOptions;
        incomeChart.update();
    } else {
        // Create Income Chart
        incomeChart = new Chart(document.getElementById('incomeChart'), {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Annual Income',
                    data: incomeData,
                    borderColor: 'rgb(153, 102, 255)',
                    tension: 0.1
                }]
            },
            options: chartOptions
        });
    }

    if (withdrawalChart) {
        withdrawalChart.data.labels = years;
        withdrawalChart.data.datasets[0].data = withdrawalData;
        withdrawalChart.options = chartOptions;
        withdrawalChart.update();
    } else {
        // Create Withdrawal Chart
        withdrawalChart = new Chart(document.getElementById('withdrawalChart'), {
            type: 'line',
            data: {
                labels: years,
                datasets: [{
                    label: 'Annual Withdrawals',
                    data: withdrawalData,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }]
            },
            options: chartOptions
        });
    }
}

function updateSummaryStats(networthData, incomeData, inputs) {
    const retirementIndex = inputs.retirementAge - inputs.currentAge;
    const retirementPortfolio = networthData[retirementIndex];
    const monthlyRetirementIncome = incomeData[retirementIndex] / 12;
    
    // Calculate retirement readiness score (simple version)
    const yearsOfIncome = retirementPortfolio / inputs.desiredIncome;
    let readinessScore = yearsOfIncome >= 25 ? 'Excellent' :
                        yearsOfIncome >= 20 ? 'Very Good' :
                        yearsOfIncome >= 15 ? 'Good' :
                        yearsOfIncome >= 10 ? 'Fair' : 'Needs Attention';

    document.getElementById('readinessScore').textContent = readinessScore;
    document.getElementById('retirementPortfolio').textContent = 
        '$' + Math.round(retirementPortfolio).toLocaleString();
    document.getElementById('monthlyIncome').textContent = 
        '$' + Math.round(monthlyRetirementIncome).toLocaleString();
}

function saveScenario() {
    const scenarioName = prompt('Enter a name for this scenario:');
    if (!scenarioName) return;

    const inputs = {};
    document.querySelectorAll('input').forEach(input => {
        inputs[input.id] = input.value;
    });

    const scenarios = JSON.parse(localStorage.getItem('retirementScenarios') || '{}');
    scenarios[scenarioName] = inputs;
    localStorage.setItem('retirementScenarios', JSON.stringify(scenarios));

    updateScenariosList();
}

function loadScenario(scenarioName) {
    const scenarios = JSON.parse(localStorage.getItem('retirementScenarios') || '{}');
    const inputs = scenarios[scenarioName];

    for (const [id, value] of Object.entries(inputs)) {
        const input = document.getElementById(id);
        if (input) input.value = value;
    }

    // Update tax estimates before recalculating
    updateTaxEstimates();
    
    // Recalculate retirement projections
    calculateRetirement();
}

function updateScenariosList() {
    const scenarios = JSON.parse(localStorage.getItem('retirementScenarios') || '{}');
    const container = document.getElementById('scenariosList');
    container.innerHTML = '';

    for (const scenarioName of Object.keys(scenarios)) {
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.innerHTML = `
            <h3>${scenarioName}</h3>
            <button onclick="loadScenario('${scenarioName}')">Load</button>
            <button onclick="deleteScenario('${scenarioName}')">Delete</button>
        `;
        container.appendChild(card);
    }
}

function deleteScenario(scenarioName) {
    const scenarios = JSON.parse(localStorage.getItem('retirementScenarios') || '{}');
    delete scenarios[scenarioName];
    localStorage.setItem('retirementScenarios', JSON.stringify(scenarios));
    updateScenariosList();
}

function exportResults() {
    const inputs = {};
    document.querySelectorAll('input').forEach(input => {
        inputs[input.id] = input.value;
    });

    const results = {
        inputs: inputs,
        summary: {
            readinessScore: document.getElementById('readinessScore').textContent,
            retirementPortfolio: document.getElementById('retirementPortfolio').textContent,
            monthlyIncome: document.getElementById('monthlyIncome').textContent
        }
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retirement-calculation.json';
    a.click();
    URL.revokeObjectURL(url);
}

function getInputs() {
    const stockAllocation = Number(document.getElementById('stockAllocation').value) / 100;
    const bondAllocation = Number(document.getElementById('bondAllocation').value) / 100;
    const stockReturn = Number(document.getElementById('stockReturn').value) / 100;
    const bondReturn = Number(document.getElementById('bondReturn').value) / 100;
    
    // Get 401(k) contribution and match details
    const traditional401kContrib = Number(document.getElementById('traditional401kContrib').value);
    const roth401kContrib = Number(document.getElementById('roth401kContrib').value);
    const total401kContrib = traditional401kContrib + roth401kContrib;
    const employerMatchLimit = Number(document.getElementById('employerMatchLimit').value);
    
    // Calculate employer match (dollar for dollar up to limit)
    const employerContribution = Math.min(total401kContrib, employerMatchLimit);
    
    // Calculate annual savings (no need to total everything since we track separately now)
    const annualSavings = Number(document.getElementById('annualSavings').value);
    
    // Calculate blended return
    const expectedReturn = (stockReturn * stockAllocation + bondReturn * bondAllocation) * 100;
    
    const currentSalary = Number(document.getElementById('currentSalary').value);
    const desiredIncome = Number(document.getElementById('desiredIncome').value);
    
    // Estimate tax brackets if not manually set
    const manualCurrentTax = document.getElementById('taxBracket').value !== '';
    const manualRetirementTax = document.getElementById('retirementTaxBracket').value !== '';
    
    const currentTaxBracket = manualCurrentTax ? 
        Number(document.getElementById('taxBracket').value) : 
        estimateTaxBracket(currentSalary);
    
    const retirementTaxBracket = manualRetirementTax ? 
        Number(document.getElementById('retirementTaxBracket').value) : 
        estimateTaxBracket(desiredIncome);
    
    return {
        // Current situation
        currentAge: Number(document.getElementById('currentAge').value),
        currentSalary: currentSalary,
        currentSavings: Number(document.getElementById('currentSavings').value),  // Just non-retirement savings
        annualSavings: annualSavings,  // Just non-retirement savings
        
        // Investment assumptions
        expectedReturn: expectedReturn,
        salaryIncrease: Number(document.getElementById('salaryIncrease').value) / 100,
        inflationRate: Number(document.getElementById('inflationRate').value) / 100,
        
        // Retirement goals
        retirementAge: Number(document.getElementById('retirementAge').value),
        desiredIncome: desiredIncome,
        lifeExpectancy: Number(document.getElementById('lifeExpectancy').value),
        
        // Social Security
        ssBenefitAge: Number(document.getElementById('ssBenefitAge').value),
        ssMonthlyBenefit: Number(document.getElementById('ssMonthlyBenefit').value),
        
        // Pension
        pensionAge: Number(document.getElementById('pensionAge').value),
        pensionAmount: Number(document.getElementById('pensionAmount').value),
        
        // 401(k) and IRA contributions
        traditional401kContrib: traditional401kContrib,
        roth401kContrib: roth401kContrib,
        employerContribution: employerContribution,
        iraContrib: Number(document.getElementById('iraContrib').value),
        
        // Account balances
        traditional401k: Number(document.getElementById('traditional401k').value),
        roth401k: Number(document.getElementById('roth401k').value),
        traditionalIRA: Number(document.getElementById('traditionalIRA').value),
        rothIRA: Number(document.getElementById('rothIRA').value),
        
        // Tax information
        currentTaxBracket: currentTaxBracket,
        retirementTaxBracket: retirementTaxBracket
    };
}

function calculateSocialSecurityAdjustment(benefitAge) {
    // Simple Social Security adjustment based on claiming age
    if (benefitAge < 62) return 0;
    if (benefitAge < 67) return 0.7 + (benefitAge - 62) * 0.06; // Rough approximation
    if (benefitAge < 70) return 1.0 + (benefitAge - 67) * 0.08;
    return 1.24; // Maximum benefit at age 70
}

function calculateRMD(age, balance) {
    // RMD calculation based on IRS Publication 590-B
    if (age < 72) return 0;
    
    const rmdTable = {
        72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0,
        79: 21.1, 80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0,
        86: 15.2, 87: 14.4, 88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8,
        93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4
    };
    
    const divisor = rmdTable[age] || 6.4; // Use age 100+ divisor for ages over 100
    return balance / divisor;
}

function showTab(tabName) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show the selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to the clicked button
    document.querySelector(`button[onclick="showTab('${tabName}')"]`).classList.add('active');
}

function estimateTaxBracket(income) {
    // 2024 tax brackets (married filing jointly)
    if (income <= 23200) return 10;
    if (income <= 94300) return 12;
    if (income <= 201050) return 22;
    if (income <= 383900) return 24;
    if (income <= 487450) return 32;
    if (income <= 731200) return 35;
    return 37;
}

function updateTaxEstimates() {
    const currentSalary = Number(document.getElementById('currentSalary').value);
    const desiredIncome = Number(document.getElementById('desiredIncome').value);
    
    const currentTaxBracket = estimateTaxBracket(currentSalary);
    const retirementTaxBracket = estimateTaxBracket(desiredIncome);
    
    // Update the displayed estimates
    document.getElementById('estimatedCurrentTax').textContent = currentTaxBracket;
    document.getElementById('estimatedRetirementTax').textContent = retirementTaxBracket;
    
    // Update the override input fields if they're empty
    const taxBracketInput = document.getElementById('taxBracket');
    const retirementTaxBracketInput = document.getElementById('retirementTaxBracket');
    
    if (!taxBracketInput.value) {
        taxBracketInput.value = currentTaxBracket;
    }
    if (!retirementTaxBracketInput.value) {
        retirementTaxBracketInput.value = retirementTaxBracket;
    }
}

// Add this function to categorize insights
function categorizeInsight(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('savings') || lowerTitle.includes('contribution') || lowerTitle.includes('income')) {
        return 'savings';
    } else if (lowerTitle.includes('investment') || lowerTitle.includes('allocation') || lowerTitle.includes('return')) {
        return 'investment';
    } else if (lowerTitle.includes('tax')) {
        return 'tax';
    } else if (lowerTitle.includes('risk') || lowerTitle.includes('warning')) {
        return 'risk';
    }
    
    return 'other';
}

// Enhanced AI Analysis function
async function getAIAnalysis() {
    const loading = document.getElementById('analysisLoading');
    const resultsContainer = document.querySelector('.insight-cards');
    const actionsContainer = document.querySelector('.analysis-actions');
    
    // Show loading spinner - first remove the hidden class
    loading.classList.remove('hidden');  
    // Then set display style
    loading.style.display = 'flex';      
    
    resultsContainer.innerHTML = '';
    actionsContainer.classList.add('hidden');
    
    try {
        // First check if Ollama is running
        const checkResponse = await fetch('/ollama/api/tags', { 
            signal: AbortSignal.timeout(5000) // 5 second timeout
        }).catch(error => {
            throw new Error('Cannot connect to Ollama. Is it running?');
        });

        if (!checkResponse.ok) {
            throw new Error('Ollama service is not responding correctly');
        }

        const inputs = getInputs();
        
        // Prepare the analysis prompt
        const prompt = `
            Please analyze this retirement scenario and provide 4-5 key insights and suggestions:
            
            Current Situation:
            - Age: ${inputs.currentAge}
            - Annual Salary: $${inputs.currentSalary.toLocaleString()}
            - Total Current Savings: $${(inputs.currentSavings + inputs.traditional401k + inputs.roth401k + inputs.traditionalIRA + inputs.rothIRA).toLocaleString()}
            
            Retirement Goals:
            - Retirement Age: ${inputs.retirementAge}
            - Desired Annual Income: $${inputs.desiredIncome.toLocaleString()}
            - Life Expectancy: ${inputs.lifeExpectancy}
            
            Social Security & Pension:
            - Social Security: $${inputs.ssMonthlyBenefit} monthly starting at age ${inputs.ssBenefitAge}
            - Pension: $${inputs.pensionAmount} monthly starting at age ${inputs.pensionAge}
            
            Investment Details:
            - Stock/Bond Allocation: ${document.getElementById('stockAllocation').value}%/${document.getElementById('bondAllocation').value}%
            - Expected Returns: Stocks ${document.getElementById('stockReturn').value}%, Bonds ${document.getElementById('bondReturn').value}%
            - Annual Contributions: 
              * Traditional 401(k): $${inputs.traditional401kContrib}
              * Roth 401(k): $${inputs.roth401kContrib}
              * IRA: $${inputs.iraContrib}
              * Other Savings: $${inputs.annualSavings}
            
            Please provide specific, actionable insights about:
            1. Savings rate and retirement readiness
            2. Investment allocation and risk
            3. Tax optimization
            4. Social Security and pension optimization
            5. Any red flags or opportunities

            Format each insight with a clear title line followed by the details.
            Separate insights with blank lines.
        `;

        const response = await fetch('/ollama/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "deepseek-r1:7b",
                prompt: prompt,
                stream: false
            }),
            signal: AbortSignal.timeout(60000) // 60 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.response) {
            throw new Error('No response from Ollama');
        }

        const analysis = data.response;

        // Parse the analysis into sections and create insight cards
        const insights = analysis.split('\n\n').filter(section => section.trim());
        
        // Map for insights by category
        const insightsByCategory = {};
        
        insights.forEach(section => {
            const [title, ...content] = section.split('\n');
            const cleanTitle = title.replace(/^[- ]*/, '');  // Remove leading dashes or spaces
            const category = categorizeInsight(cleanTitle);
            const icon = getIconForTitle(cleanTitle);
            
            // Group by category
            if (!insightsByCategory[category]) {
                insightsByCategory[category] = [];
            }
            
            insightsByCategory[category].push({
                title: cleanTitle,
                icon: icon,
                content: content.join('\n'),
                category: category
            });
        });
        
        // Display all insights
        Object.values(insightsByCategory).flat().forEach(insight => {
            const card = document.createElement('div');
            card.className = `insight-card ${insight.category}`;
            card.dataset.category = insight.category;
            card.innerHTML = `
                <h3><i class="fas ${insight.icon}"></i> ${insight.title}</h3>
                <p>${insight.content}</p>
            `;
            resultsContainer.appendChild(card);
        });
        
        // Setup category filtering
        setupCategoryTabs();
        
        // Show export button
        actionsContainer.classList.remove('hidden');

    } catch (error) {
        console.error('AI Analysis Error:', error);
        resultsContainer.innerHTML = `
            <div class="insight-card error">
                <h3><i class="fas fa-exclamation-triangle"></i> Connection Error</h3>
                <p>${error.message}</p>
                <p>Troubleshooting steps:</p>
                <ul>
                    <li>Make sure Ollama is installed and running</li>
                    <li>Check that you've pulled the model: ollama pull deepseek-r1:7b</li>
                    <li>Try restarting Ollama</li>
                    <li>Check browser console for detailed error messages</li>
                </ul>
            </div>
        `;
    } finally {
        // Hide loading spinner
        loading.classList.add('hidden');
        loading.style.display = 'none';
    }
}

function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    const cards = document.querySelectorAll('.insight-card');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            const category = tab.dataset.category;
            
            // Show/hide cards based on category
            cards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function exportAnalysis() {
    const insights = [];
    document.querySelectorAll('.insight-card').forEach(card => {
        if (card.style.display !== 'none' && !card.classList.contains('error')) {
            const title = card.querySelector('h3').textContent;
            const content = card.querySelector('p').textContent;
            insights.push({ title, content });
        }
    });
    
    if (insights.length === 0) {
        alert('No analysis results to export.');
        return;
    }
    
    const inputs = getInputs();
    
    const exportData = {
        date: new Date().toLocaleDateString(),
        retirementPlan: {
            currentAge: inputs.currentAge,
            retirementAge: inputs.retirementAge,
            currentSalary: inputs.currentSalary,
            desiredIncome: inputs.desiredIncome,
            totalSavings: inputs.currentSavings + inputs.traditional401k + inputs.roth401k + inputs.traditionalIRA + inputs.rothIRA
        },
        insights: insights
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement-analysis-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function getIconForTitle(title) {
    const iconMap = {
        'Savings Rate': 'fa-piggy-bank',
        'Investment': 'fa-chart-pie',
        'Tax': 'fa-file-invoice-dollar',
        'Risk': 'fa-shield-alt',
        'Opportunity': 'fa-lightbulb',
        'Warning': 'fa-exclamation-triangle'
    };
    
    for (const [key, icon] of Object.entries(iconMap)) {
        if (title.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    return 'fa-chart-line'; // default icon
}

// Replace multiple event listeners with event delegation
document.querySelector('.input-section').addEventListener('change', function(e) {
    if (e.target.tagName === 'INPUT') {
        // For tax-specific inputs, update tax estimates
        if (e.target.id === 'currentSalary' || e.target.id === 'desiredIncome') {
            updateTaxEstimates();
        }
        
        // Recalculate for any input change
        calculateRetirement();
    }
});

// Add event listener for calculate button
document.addEventListener('DOMContentLoaded', () => {
    calculateRetirement();
    updateScenariosList();
    
    // Show personal tab by default
    showTab('personal');
    
    // Add input event listeners to recalculate on change
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', calculateRetirement);
    });
    
    // Update tax estimates when relevant inputs change
    document.getElementById('currentSalary').addEventListener('change', updateTaxEstimates);
    document.getElementById('desiredIncome').addEventListener('change', updateTaxEstimates);
    
    // Initial tax estimate update
    updateTaxEstimates();
    
    // Add event listeners for clearing override values
    document.getElementById('taxBracket').addEventListener('focus', function() {
        if (this.value === estimateTaxBracket(Number(document.getElementById('currentSalary').value)).toString()) {
            this.value = '';
        }
    });
    
    document.getElementById('retirementTaxBracket').addEventListener('focus', function() {
        if (this.value === estimateTaxBracket(Number(document.getElementById('desiredIncome').value)).toString()) {
            this.value = '';
        }
    });

    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    const icon = darkModeToggle.querySelector('i');
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        icon.classList.replace('fa-sun', 'fa-moon');
    }
    
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        // Toggle icon
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('darkMode', 'true');
        } else {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('darkMode', 'false');
        }
        
        // Redraw charts with new theme colors
        calculateRetirement();
    });

    // Setup allocation inputs to ensure they total 100%
    const stockAllocation = document.getElementById('stockAllocation');
    const bondAllocation = document.getElementById('bondAllocation');
    
    stockAllocation.addEventListener('change', function() {
        bondAllocation.value = 100 - Number(this.value);
        calculateRetirement();
    });
    
    bondAllocation.addEventListener('change', function() {
        stockAllocation.value = 100 - Number(this.value);
        calculateRetirement();
    });
});