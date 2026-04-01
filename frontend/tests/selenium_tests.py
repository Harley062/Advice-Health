"""
Selenium end-to-end tests for the To-Do application.

Prerequisites:
    pip install selenium webdriver-manager
    The app must be running at http://localhost:3000
    The backend must be running at http://localhost:8000
"""

import time
import uuid
import unittest

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://localhost:3000"

# Unique email per test run to avoid conflicts
TEST_EMAIL = f"selenium_{uuid.uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "Selenium123!"
TEST_USERNAME = f"selenium_{uuid.uuid4().hex[:6]}"


def get_driver():
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1280,800")
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        service = Service(ChromeDriverManager().install())
        return webdriver.Chrome(service=service, options=options)
    except Exception:
        return webdriver.Chrome(options=options)


class TestLoginFlow(unittest.TestCase):
    """Test the login and registration flow."""

    @classmethod
    def setUpClass(cls):
        cls.driver = get_driver()
        cls.wait = WebDriverWait(cls.driver, 15)
        cls._register_user()

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    @classmethod
    def _register_user(cls):
        driver = cls.driver
        wait = cls.wait

        driver.get(f"{BASE_URL}/register")
        wait.until(EC.presence_of_element_located((By.ID, "username")))

        driver.find_element(By.ID, "username").send_keys(TEST_USERNAME)
        driver.find_element(By.ID, "reg-email").send_keys(TEST_EMAIL)
        driver.find_element(By.ID, "reg-password").send_keys(TEST_PASSWORD)
        driver.find_element(By.ID, "password2").send_keys(TEST_PASSWORD)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        wait.until(EC.url_to_be(f"{BASE_URL}/"))

    def test_01_register_and_redirect_to_dashboard(self):
        """After registration the user lands on the dashboard."""
        self.assertEqual(self.driver.current_url, f"{BASE_URL}/")

    def test_02_logout_redirects_to_login(self):
        """Clicking logout sends the user to /login."""
        self.driver.get(f"{BASE_URL}/")
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//button[text()='Logout']")))
        self.driver.find_element(By.XPATH, "//button[text()='Logout']").click()
        self.wait.until(EC.url_contains("/login"))
        self.assertIn("/login", self.driver.current_url)

    def test_03_login_with_valid_credentials(self):
        """Valid credentials log the user in and redirect to dashboard."""
        self.driver.get(f"{BASE_URL}/login")
        self.wait.until(EC.presence_of_element_located((By.ID, "email")))

        self.driver.find_element(By.ID, "email").send_keys(TEST_EMAIL)
        self.driver.find_element(By.ID, "password").send_keys(TEST_PASSWORD)
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        self.wait.until(EC.url_to_be(f"{BASE_URL}/"))
        self.assertEqual(self.driver.current_url, f"{BASE_URL}/")

    def test_04_login_with_wrong_password(self):
        """Wrong password shows an error message."""
        self.driver.get(f"{BASE_URL}/login")
        self.wait.until(EC.presence_of_element_located((By.ID, "email")))

        self.driver.find_element(By.ID, "email").send_keys(TEST_EMAIL)
        self.driver.find_element(By.ID, "password").send_keys("WrongPassword!")
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        error_el = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".bg-red-50"))
        )
        self.assertTrue(error_el.is_displayed())


class TestCreateTask(unittest.TestCase):
    """Tests for creating tasks on the dashboard."""

    @classmethod
    def setUpClass(cls):
        cls.driver = get_driver()
        cls.wait = WebDriverWait(cls.driver, 15)
        cls._login()

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    @classmethod
    def _login(cls):
        """Log in using the shared test account (must already be registered)."""
        driver = cls.driver
        wait = cls.wait

        # Register a fresh user for this test class
        reg_email = f"selenium_ct_{uuid.uuid4().hex[:8]}@example.com"
        reg_username = f"sel_ct_{uuid.uuid4().hex[:6]}"

        driver.get(f"{BASE_URL}/register")
        wait.until(EC.presence_of_element_located((By.ID, "username")))
        driver.find_element(By.ID, "username").send_keys(reg_username)
        driver.find_element(By.ID, "reg-email").send_keys(reg_email)
        driver.find_element(By.ID, "reg-password").send_keys(TEST_PASSWORD)
        driver.find_element(By.ID, "password2").send_keys(TEST_PASSWORD)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        wait.until(EC.url_to_be(f"{BASE_URL}/"))

    def test_01_dashboard_loads(self):
        """Dashboard page loads correctly."""
        self.driver.get(f"{BASE_URL}/")
        self.wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(),'My Tasks')]")))
        heading = self.driver.find_element(By.XPATH, "//h1[contains(text(),'My Tasks')]")
        self.assertTrue(heading.is_displayed())

    def test_02_open_task_form(self):
        """Clicking '+ New Task' opens the task creation modal."""
        self.driver.get(f"{BASE_URL}/")
        btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='new-task-btn']")))
        btn.click()
        title_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-title-input']")))
        self.assertTrue(title_input.is_displayed())

    def test_03_create_task_successfully(self):
        """Filling in the form and submitting creates a task."""
        self.driver.get(f"{BASE_URL}/")
        btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='new-task-btn']")))
        btn.click()

        title_input = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-title-input']")))
        task_title = f"Selenium Task {uuid.uuid4().hex[:6]}"
        title_input.send_keys(task_title)

        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='task-submit-btn']")
        submit_btn.click()

        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-card']")))
        cards = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='task-title']")
        titles = [c.text for c in cards]
        self.assertIn(task_title, titles)

    def test_04_create_task_without_title_fails(self):
        """Submitting an empty title should not create a task (HTML5 required)."""
        self.driver.get(f"{BASE_URL}/")
        btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='new-task-btn']")))
        btn.click()

        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-title-input']")))
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='task-submit-btn']")
        submit_btn.click()

        # Modal should remain open (form validation prevents submit)
        title_input = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='task-title-input']")
        self.assertTrue(title_input.is_displayed())


class TestMarkTaskComplete(unittest.TestCase):
    """Tests for toggling task completion status."""

    @classmethod
    def setUpClass(cls):
        cls.driver = get_driver()
        cls.wait = WebDriverWait(cls.driver, 15)
        cls._login_and_create_task()

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    @classmethod
    def _login_and_create_task(cls):
        driver = cls.driver
        wait = cls.wait

        reg_email = f"selenium_mc_{uuid.uuid4().hex[:8]}@example.com"
        reg_username = f"sel_mc_{uuid.uuid4().hex[:6]}"

        driver.get(f"{BASE_URL}/register")
        wait.until(EC.presence_of_element_located((By.ID, "username")))
        driver.find_element(By.ID, "username").send_keys(reg_username)
        driver.find_element(By.ID, "reg-email").send_keys(reg_email)
        driver.find_element(By.ID, "reg-password").send_keys(TEST_PASSWORD)
        driver.find_element(By.ID, "password2").send_keys(TEST_PASSWORD)
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        wait.until(EC.url_to_be(f"{BASE_URL}/"))

        # Create a task
        btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='new-task-btn']")))
        btn.click()
        title_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-title-input']")))
        cls.task_title = f"Toggle Task {uuid.uuid4().hex[:6]}"
        title_input.send_keys(cls.task_title)
        driver.find_element(By.CSS_SELECTOR, "[data-testid='task-submit-btn']").click()
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-card']")))
        time.sleep(0.5)

    def test_01_task_initially_incomplete(self):
        """Newly created task is not completed."""
        self.driver.get(f"{BASE_URL}/")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-card']")))
        cards = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='task-title']")
        titles = [c.text for c in cards]
        self.assertIn(self.task_title, titles)

    def test_02_mark_task_complete(self):
        """Clicking the toggle button marks the task complete."""
        self.driver.get(f"{BASE_URL}/")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-card']")))

        # Find the toggle button in the first task card
        toggle_btn = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid^='toggle-']"))
        )
        toggle_btn.click()

        # The card should now show completed styling (line-through or opacity change)
        time.sleep(1)
        card = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='task-card']")
        card_class = card.get_attribute("class")
        self.assertIn("opacity-60", card_class)

    def test_03_toggle_task_back_to_incomplete(self):
        """Clicking toggle again marks the task incomplete."""
        self.driver.get(f"{BASE_URL}/")
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='task-card']")))

        toggle_btn = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid^='toggle-']"))
        )
        toggle_btn.click()
        time.sleep(1)

        card = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='task-card']")
        card_class = card.get_attribute("class")
        self.assertNotIn("opacity-60", card_class)


if __name__ == "__main__":
    unittest.main(verbosity=2)
