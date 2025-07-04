import unittest
import requests
import json
import uuid
import time
from enum import Enum

# Backend URL from frontend/.env
BACKEND_URL = "https://5e5ca3ce-5358-45d5-b5ca-09397b1273f7.preview.emergentagent.com/api"

class UserRole(str, Enum):
    HOMEOWNER = "homeowner"
    SERVICE_PROVIDER = "service_provider"
    ADMIN = "admin"

class ServiceCategory(str, Enum):
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    CARPENTRY = "carpentry"
    PAINTING = "painting"
    LANDSCAPING = "landscaping"
    ROOFING = "roofing"
    HVAC = "hvac"
    GENERAL = "general"

class TestBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up test data and variables that will be used across all tests"""
        # Generate unique identifiers for test users to avoid conflicts
        cls.test_id = str(uuid.uuid4())[:8]
        
        # Test user credentials
        cls.homeowner_email = f"homeowner_{cls.test_id}@example.com"
        cls.homeowner_password = "Password123!"
        cls.homeowner_name = f"Homeowner {cls.test_id}"
        
        cls.provider_email = f"provider_{cls.test_id}@example.com"
        cls.provider_password = "Password123!"
        cls.provider_name = f"Provider {cls.test_id}"
        
        cls.admin_email = f"admin_{cls.test_id}@example.com"
        cls.admin_password = "Password123!"
        cls.admin_name = f"Admin {cls.test_id}"
        
        # Store tokens and user IDs
        cls.homeowner_token = None
        cls.homeowner_id = None
        cls.provider_token = None
        cls.provider_id = None
        cls.admin_token = None
        cls.admin_id = None
        
        # Store created resource IDs
        cls.provider_profile_id = None
        cls.service_request_id = None

    def test_01_root_endpoint(self):
        """Test the root API endpoint"""
        response = requests.get(f"{BACKEND_URL}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "Fetan Digital Platform API")

    # User Authentication System Tests
    def test_02_register_homeowner(self):
        """Test homeowner registration"""
        payload = {
            "email": self.homeowner_email,
            "password": self.homeowner_password,
            "name": self.homeowner_name,
            "role": UserRole.HOMEOWNER,
            "phone": "123-456-7890",
            "address": "123 Main St, City, Country"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.homeowner_email)
        self.assertEqual(data["user"]["name"], self.homeowner_name)
        self.assertEqual(data["user"]["role"], UserRole.HOMEOWNER)
        
        # Store token and user ID for later tests
        self.__class__.homeowner_token = data["access_token"]
        self.__class__.homeowner_id = data["user"]["id"]

    def test_03_register_service_provider(self):
        """Test service provider registration"""
        payload = {
            "email": self.provider_email,
            "password": self.provider_password,
            "name": self.provider_name,
            "role": UserRole.SERVICE_PROVIDER,
            "phone": "987-654-3210",
            "address": "456 Oak St, City, Country"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.provider_email)
        self.assertEqual(data["user"]["name"], self.provider_name)
        self.assertEqual(data["user"]["role"], UserRole.SERVICE_PROVIDER)
        
        # Store token and user ID for later tests
        self.__class__.provider_token = data["access_token"]
        self.__class__.provider_id = data["user"]["id"]

    def test_04_register_admin(self):
        """Test admin registration"""
        payload = {
            "email": self.admin_email,
            "password": self.admin_password,
            "name": self.admin_name,
            "role": UserRole.ADMIN,
            "phone": "555-555-5555",
            "address": "789 Admin St, City, Country"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.admin_email)
        self.assertEqual(data["user"]["name"], self.admin_name)
        self.assertEqual(data["user"]["role"], UserRole.ADMIN)
        
        # Store token and user ID for later tests
        self.__class__.admin_token = data["access_token"]
        self.__class__.admin_id = data["user"]["id"]

    def test_05_register_duplicate_email(self):
        """Test registration with duplicate email"""
        payload = {
            "email": self.homeowner_email,  # Using existing email
            "password": "DifferentPassword123!",
            "name": "Duplicate User",
            "role": UserRole.HOMEOWNER
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Email already registered")

    def test_06_login_valid_credentials(self):
        """Test login with valid credentials"""
        payload = {
            "email": self.homeowner_email,
            "password": self.homeowner_password
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["email"], self.homeowner_email)
        self.assertEqual(data["user"]["name"], self.homeowner_name)

    def test_07_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        payload = {
            "email": self.homeowner_email,
            "password": "WrongPassword123!"
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/login", json=payload)
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Incorrect email or password")

    def test_08_get_current_user(self):
        """Test getting current user info with JWT token"""
        headers = {"Authorization": f"Bearer {self.homeowner_token}"}
        response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["email"], self.homeowner_email)
        self.assertEqual(data["name"], self.homeowner_name)
        self.assertEqual(data["role"], UserRole.HOMEOWNER)

    def test_09_get_current_user_invalid_token(self):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Could not validate credentials")

    # Service Provider Profile Management Tests
    def test_10_create_service_provider_profile(self):
        """Test creating a service provider profile"""
        headers = {"Authorization": f"Bearer {self.provider_token}"}
        payload = {
            "business_name": f"Test Business {self.test_id}",
            "description": "Professional service provider for all your needs",
            "categories": [ServiceCategory.PLUMBING, ServiceCategory.ELECTRICAL],
            "years_experience": 5,
            "portfolio_images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="],
            "certifications": ["Certified Plumber", "Licensed Electrician"],
            "hourly_rate": 75.0,
            "availability": "weekdays and weekends",
            "service_areas": ["Downtown", "Suburbs", "Metropolitan Area"]
        }
        
        response = requests.post(f"{BACKEND_URL}/service-providers", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["business_name"], payload["business_name"])
        self.assertEqual(data["description"], payload["description"])
        self.assertEqual(data["categories"], payload["categories"])
        self.assertEqual(data["years_experience"], payload["years_experience"])
        self.assertEqual(data["user_id"], self.provider_id)
        
        # Store profile ID for later tests
        self.__class__.provider_profile_id = data["id"]

    def test_11_create_profile_as_homeowner(self):
        """Test creating a service provider profile as a homeowner (should fail)"""
        headers = {"Authorization": f"Bearer {self.homeowner_token}"}
        payload = {
            "business_name": "Invalid Business",
            "description": "This should fail",
            "categories": [ServiceCategory.GENERAL],
            "years_experience": 1
        }
        
        response = requests.post(f"{BACKEND_URL}/service-providers", headers=headers, json=payload)
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Only service providers can create profiles")

    def test_12_create_duplicate_profile(self):
        """Test creating a duplicate service provider profile"""
        headers = {"Authorization": f"Bearer {self.provider_token}"}
        payload = {
            "business_name": "Duplicate Business",
            "description": "This should fail",
            "categories": [ServiceCategory.GENERAL],
            "years_experience": 1
        }
        
        response = requests.post(f"{BACKEND_URL}/service-providers", headers=headers, json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Service provider profile already exists")

    def test_13_get_all_service_providers(self):
        """Test retrieving all service providers"""
        response = requests.get(f"{BACKEND_URL}/service-providers")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        
        # Check if our test provider is in the list
        found = False
        for provider in data:
            if provider["id"] == self.provider_profile_id:
                found = True
                self.assertEqual(provider["business_name"], f"Test Business {self.test_id}")
                self.assertEqual(provider["user_id"], self.provider_id)
                break
        
        self.assertTrue(found, "Test provider profile not found in the list")

    def test_14_get_service_providers_by_category(self):
        """Test retrieving service providers filtered by category"""
        response = requests.get(f"{BACKEND_URL}/service-providers?category={ServiceCategory.PLUMBING}")
        print(f"Response for test_14: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        
        # Check if our test provider is in the filtered list
        found = False
        for provider in data:
            if provider["id"] == self.provider_profile_id:
                found = True
                self.assertIn(ServiceCategory.PLUMBING, provider["categories"])
                break
        
        self.assertTrue(found, "Test provider profile not found in the filtered list")

    def test_15_get_service_provider_by_id(self):
        """Test retrieving a specific service provider by ID"""
        response = requests.get(f"{BACKEND_URL}/service-providers/{self.provider_profile_id}")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["id"], self.provider_profile_id)
        self.assertEqual(data["business_name"], f"Test Business {self.test_id}")
        self.assertEqual(data["user_id"], self.provider_id)
        self.assertEqual(data["user_name"], self.provider_name)
        self.assertEqual(data["user_email"], self.provider_email)

    def test_16_get_nonexistent_service_provider(self):
        """Test retrieving a non-existent service provider"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BACKEND_URL}/service-providers/{fake_id}")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Service provider not found")

    # Service Request System Tests
    def test_17_create_service_request(self):
        """Test creating a service request as a homeowner"""
        headers = {"Authorization": f"Bearer {self.homeowner_token}"}
        payload = {
            "category": ServiceCategory.PLUMBING,
            "title": f"Test Request {self.test_id}",
            "description": "Need help fixing a leaky faucet",
            "location": "123 Main St, Apartment 4B",
            "budget_range": "$50-$100",
            "timeline": "As soon as possible",
            "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="]
        }
        
        response = requests.post(f"{BACKEND_URL}/service-requests", headers=headers, json=payload)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["title"], payload["title"])
        self.assertEqual(data["description"], payload["description"])
        self.assertEqual(data["category"], payload["category"])
        self.assertEqual(data["homeowner_id"], self.homeowner_id)
        self.assertEqual(data["homeowner_name"], self.homeowner_name)
        self.assertEqual(data["homeowner_email"], self.homeowner_email)
        
        # Store request ID for later tests
        self.__class__.service_request_id = data["id"]

    def test_18_create_request_as_provider(self):
        """Test creating a service request as a service provider (should fail)"""
        headers = {"Authorization": f"Bearer {self.provider_token}"}
        payload = {
            "category": ServiceCategory.ELECTRICAL,
            "title": "Invalid Request",
            "description": "This should fail",
            "location": "456 Oak St",
            "budget_range": "$100-$200",
            "timeline": "Next week"
        }
        
        response = requests.post(f"{BACKEND_URL}/service-requests", headers=headers, json=payload)
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Only homeowners can create service requests")

    def test_19_get_service_requests_as_homeowner(self):
        """Test retrieving service requests as a homeowner (should only see own requests)"""
        headers = {"Authorization": f"Bearer {self.homeowner_token}"}
        response = requests.get(f"{BACKEND_URL}/service-requests", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        
        # Homeowner should only see their own requests
        for request in data:
            self.assertEqual(request["homeowner_id"], self.homeowner_id)
        
        # Check if our test request is in the list
        found = False
        for request in data:
            if request["id"] == self.service_request_id:
                found = True
                self.assertEqual(request["title"], f"Test Request {self.test_id}")
                break
        
        self.assertTrue(found, "Test service request not found in the list")

    def test_20_get_service_requests_as_provider(self):
        """Test retrieving service requests as a service provider (should see all requests)"""
        headers = {"Authorization": f"Bearer {self.provider_token}"}
        response = requests.get(f"{BACKEND_URL}/service-requests", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        
        # Check if our test request is in the list
        found = False
        for request in data:
            if request["id"] == self.service_request_id:
                found = True
                self.assertEqual(request["title"], f"Test Request {self.test_id}")
                self.assertEqual(request["homeowner_id"], self.homeowner_id)
                break
        
        self.assertTrue(found, "Test service request not found in the list")

    def test_21_get_service_requests_by_category(self):
        """Test retrieving service requests filtered by category"""
        headers = {"Authorization": f"Bearer {self.provider_token}"}
        response = requests.get(f"{BACKEND_URL}/service-requests?category={ServiceCategory.PLUMBING}", headers=headers)
        print(f"Response for test_21: {response.status_code}, {response.text}")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIsInstance(data, list)
        
        # All requests should be in the specified category
        for request in data:
            self.assertEqual(request["category"], ServiceCategory.PLUMBING)
        
        # Check if our test request is in the filtered list
        found = False
        for request in data:
            if request["id"] == self.service_request_id:
                found = True
                self.assertEqual(request["title"], f"Test Request {self.test_id}")
                break
        
        self.assertTrue(found, "Test service request not found in the filtered list")

    def test_22_get_service_request_by_id(self):
        """Test retrieving a specific service request by ID"""
        response = requests.get(f"{BACKEND_URL}/service-requests/{self.service_request_id}")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["id"], self.service_request_id)
        self.assertEqual(data["title"], f"Test Request {self.test_id}")
        self.assertEqual(data["homeowner_id"], self.homeowner_id)
        self.assertEqual(data["homeowner_name"], self.homeowner_name)
        self.assertEqual(data["homeowner_email"], self.homeowner_email)

    def test_23_get_nonexistent_service_request(self):
        """Test retrieving a non-existent service request"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BACKEND_URL}/service-requests/{fake_id}")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Service request not found")

    # Admin Dashboard API Tests
    def test_24_get_admin_stats_as_admin(self):
        """Test retrieving admin stats as an admin user"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{BACKEND_URL}/admin/stats", headers=headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("total_users", data)
        self.assertIn("total_providers", data)
        self.assertIn("total_requests", data)
        self.assertIn("pending_requests", data)
        
        # Verify the stats include our test data
        self.assertGreaterEqual(data["total_users"], 3)  # At least our 3 test users
        self.assertGreaterEqual(data["total_providers"], 1)  # At least our test provider
        self.assertGreaterEqual(data["total_requests"], 1)  # At least our test request

    def test_25_get_admin_stats_as_non_admin(self):
        """Test retrieving admin stats as a non-admin user (should fail)"""
        # Try as homeowner
        headers = {"Authorization": f"Bearer {self.homeowner_token}"}
        response = requests.get(f"{BACKEND_URL}/admin/stats", headers=headers)
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Admin access required")
        
        # Try as service provider
        headers = {"Authorization": f"Bearer {self.provider_token}"}
        response = requests.get(f"{BACKEND_URL}/admin/stats", headers=headers)
        self.assertEqual(response.status_code, 403)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Admin access required")

if __name__ == "__main__":
    unittest.main()