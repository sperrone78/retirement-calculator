# Advanced Retirement Calculator with AI Analysis

An interactive retirement planning tool that provides comprehensive calculations and AI-powered insights using a local Large Language Model (Deepseek) through Ollama.

![Retirement Calculator Screenshot](https://placeholder-for-screenshot.png)

## Features

- **Comprehensive Calculations**: Model your retirement finances with detailed inputs for income, savings, investments, and more
- **Multi-Account Support**: Track traditional 401(k), Roth 401(k), IRAs, and taxable accounts
- **Interactive Visualizations**: Real-time charts showing net worth, income, and withdrawals over time
- **AI-Powered Analysis**: Get personalized insights about your retirement strategy
- **Scenario Management**: Save and compare different retirement scenarios
- **Tax Optimization**: Estimate tax brackets and optimize withdrawal strategies
- **Dark Mode Support**: Easy on the eyes with full dark mode theming
- **Responsive Design**: Works on desktop and mobile devices
- **Local Processing**: All calculations and AI analysis happen locally - your financial data stays private

## Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari)
- [Node.js](https://nodejs.org/) (v14 or higher) for the local server
- [Ollama](https://ollama.ai/) for running the local AI model

## Setup

### 1. Install Ollama

Ollama is an easy way to run large language models locally. Visit [ollama.ai](https://ollama.ai) and download the appropriate version for your operating system:

- **Mac**: Download the .dmg file and follow installation instructions
- **Windows**: Download the installer and follow installation instructions
- **Linux**: Follow the installation instructions for your distribution

### 2. Install the Deepseek model

Once Ollama is installed, open a terminal/command prompt and run:

```
ollama pull deepseek-r1:7b
```

This will download the Deepseek model (~4GB) which provides the AI analysis functionality.

### 3. Set up the application

Clone this repository and install dependencies:
git clone https://github.com/yourusername/retirement-calculator.git
cd retirement-calculator
npm install

### 4. Start the application

npm start


This will start a local server and proxy requests to Ollama. Open your browser to [http://localhost:3000](http://localhost:3000) to use the calculator.

## Usage

### Basic Calculations

1. Enter your personal information in the "Personal Info" tab
2. Input your current investments and contribution details in the "Investments" tab
3. Specify your retirement goals in the "Retirement" tab
4. Review the results in the charts and summary statistics

### AI Analysis

1. Navigate to the "AI Analysis" tab
2. Click "Analyze My Retirement Plan"
3. The AI will process your inputs and provide tailored insights about:
   - Savings rate and retirement readiness
   - Investment allocation and risk
   - Tax optimization strategies
   - Potential opportunities or concerns

### Managing Scenarios

- **Save Scenario**: After inputting your data, click "Save Scenario" and provide a name
- **Load Scenario**: Click "Load" on any saved scenario to restore those inputs
- **Delete Scenario**: Remove unwanted scenarios with the "Delete" button

### Exporting Results

- **Export Results**: Click "Export Results" to download a JSON file with your current retirement calculations
- **Export Analysis**: Click "Export Analysis" in the Analysis tab to save the AI insights

## How AI Analysis Works

The retirement calculator connects to the locally running Ollama service to access the Deepseek language model. When you request an analysis:

1. Your financial inputs are formatted into a prompt
2. This prompt is sent to the Deepseek model via Ollama's API
3. The model analyzes your retirement plan and generates personalized insights
4. Results are categorized and displayed as interactive cards

All processing happens on your local machine - no financial data is sent to external servers.

## Troubleshooting

### AI Analysis Not Working?

1. Ensure Ollama is running (check for the Ollama icon in your system tray/menu bar)
2. Verify the model is installed by running `ollama list` in a terminal
3. If needed, restart Ollama and refresh the page
4. Check browser console for specific error messages

### Browser Compatibility Issues?

The app works best in modern browsers. If you encounter display issues:
- Try updating your browser to the latest version
- Clear your browser cache and reload
- Try a different browser if problems persist

## Technologies Used

- HTML5, CSS3, and JavaScript (ES6+)
- Chart.js for data visualization
- Local Storage API for saving scenarios
- Ollama for local AI model serving
- Deepseek-r1:7b language model for analysis

## License

This project is licensed under the MIT License - see the LICENSE file for details.