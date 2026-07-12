const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PORTS = [5173, 5174, 5175];
const PROTECTED_ROUTES = [
  '/dashboard',
  '/fleet',
  '/drivers',
  '/trips',
  '/maintenance',
  '/fuel-expenses',
  '/analytics',
  '/organization',
  '/settings'
];

async function checkPort(port) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`http://localhost:${port}/`, { timeout: 3000 });
    await browser.close();
    return true;
  } catch (e) {
    await browser.close();
    return false;
  }
}

async function runTests() {
  console.log('Finding active port...');
  let activePort = null;
  for (const port of PORTS) {
    const active = await checkPort(port);
    if (active) {
      activePort = port;
      console.log(`Found active port: ${port}`);
      break;
    }
  }

  if (!activePort) {
    console.error('Could not find active frontend server on ports', PORTS);
    process.exit(1);
  }

  const baseUrl = `http://localhost:${activePort}`;
  const results = [];
  const logResult = (route, status, details) => {
    console.log(`[${status}] ${route} - ${details}`);
    results.push({ route, status, details });
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Test Landing Page (/)
    logResult('/', 'PENDING', 'Testing Landing Page...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle2' });
    
    // Check for logo
    const logoExists = await page.evaluate(() => {
      const img = document.querySelector('img[alt="TransitOps Logo"]');
      return img !== null;
    });

    // Check for title text
    const titleText = await page.evaluate(() => {
      return document.body.innerText.includes('TransitOps');
    });

    // Check for Sign In and Register buttons
    const buttonsExist = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const hasSignIn = btns.some(b => b.textContent.includes('Sign In'));
      const hasRegister = btns.some(b => b.textContent.includes('Register'));
      return { hasSignIn, hasRegister };
    });

    if (logoExists && titleText && buttonsExist.hasSignIn && buttonsExist.hasRegister) {
      logResult('/', 'SUCCESS', 'Logo, title, Sign In, and Register buttons are verified.');
    } else {
      logResult('/', 'FAILURE', `Elements check failed. Logo: ${logoExists}, Title: ${titleText}, Buttons: ${JSON.stringify(buttonsExist)}`);
    }

    // 2. Test login flow and route to LoginPage
    logResult('/login', 'PENDING', 'Navigating to Login Page...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
    const isLoginForm = await page.evaluate(() => {
      return document.querySelector('#login-form') !== null;
    });

    if (isLoginForm) {
      logResult('/login', 'SUCCESS', 'Login form successfully rendered.');
    } else {
      logResult('/login', 'FAILURE', 'Login form not found.');
    }

    // Perform Login
    console.log('Logging in with Fleet Manager demo account...');
    await page.click('#demo-manager');
    await page.waitForSelector('#login-submit');
    await page.click('#login-submit');

    // Wait for redirection to dashboard or trips
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    const currentUrl = page.url();
    console.log(`Redirection URL after login: ${currentUrl}`);

    // Verify successful login
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/trips')) {
      console.log('Login successful.');
    } else {
      throw new Error('Login redirect failed.');
    }

    // 3. Test protected routes
    for (const route of PROTECTED_ROUTES) {
      logResult(route, 'PENDING', `Testing access to ${route}...`);
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle2' });

      // Check if page redirected back to login
      const redirectedToLogin = page.url().includes('/login');
      if (redirectedToLogin) {
        logResult(route, 'FAILURE', 'Redirected to login page (Unauthorized).');
        continue;
      }

      // Check if the restricted page matches
      const isRestricted = page.url().includes('/restricted');
      if (isRestricted) {
        logResult(route, 'FAILURE', 'Redirected to restricted page (Forbidden).');
        continue;
      }

      // Check if general nav elements are loaded
      const hasNavbar = await page.evaluate(() => {
        return document.querySelector('nav') !== null || document.body.innerText.includes('Sign Out') || document.body.innerText.includes('TransitOps');
      });

      if (hasNavbar) {
        logResult(route, 'SUCCESS', 'Route loaded successfully with active authenticated layout.');
      } else {
        logResult(route, 'FAILURE', 'Navbar or core layout elements not found on the page.');
      }
    }

  } catch (error) {
    console.error('An error occurred during testing:', error);
  } finally {
    await browser.close();
  }

  // Generate markdown report
  let markdown = `# Route Verification Test Results\n\n`;
  markdown += `Generated on: ${new Date().toISOString()}\n`;
  markdown += `Base URL: ${baseUrl}\n\n`;
  markdown += `| Route | Status | Details |\n`;
  markdown += `| --- | --- | --- |\n`;

  results.forEach(r => {
    const statusEmoji = r.status === 'SUCCESS' ? '✅ SUCCESS' : r.status === 'FAILURE' ? '❌ FAILURE' : '⏳ PENDING';
    markdown += `| \`${r.route}\` | **${statusEmoji}** | ${r.details} |\n`;
  });

  const reportPath = path.join(__dirname, '..', 'route_testing_results.md');
  fs.writeFileSync(reportPath, markdown);
  console.log(`Test report saved to: ${reportPath}`);
}

runTests();
