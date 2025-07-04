from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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

class RequestStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime
    is_active: bool

class ServiceProvider(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    business_name: str
    description: str
    categories: List[ServiceCategory]
    years_experience: int
    portfolio_images: List[str] = []  # Base64 encoded images
    certifications: List[str] = []
    hourly_rate: Optional[float] = None
    availability: str = "weekdays"
    service_areas: List[str] = []
    rating: float = 0.0
    review_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceProviderCreate(BaseModel):
    business_name: str
    description: str
    categories: List[ServiceCategory]
    years_experience: int
    portfolio_images: List[str] = []
    certifications: List[str] = []
    hourly_rate: Optional[float] = None
    availability: str = "weekdays"
    service_areas: List[str] = []

class ServiceProviderResponse(BaseModel):
    id: str
    user_id: str
    business_name: str
    description: str
    categories: List[ServiceCategory]
    years_experience: int
    portfolio_images: List[str] = []
    certifications: List[str] = []
    hourly_rate: Optional[float] = None
    availability: str
    service_areas: List[str]
    rating: float
    review_count: int
    created_at: datetime
    user_name: str
    user_email: str
    user_phone: Optional[str] = None

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    homeowner_id: str
    category: ServiceCategory
    title: str
    description: str
    location: str
    budget_range: str
    timeline: str
    images: List[str] = []  # Base64 encoded images
    status: RequestStatus = RequestStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequestCreate(BaseModel):
    category: ServiceCategory
    title: str
    description: str
    location: str
    budget_range: str
    timeline: str
    images: List[str] = []

class ServiceRequestResponse(BaseModel):
    id: str
    homeowner_id: str
    category: ServiceCategory
    title: str
    description: str
    location: str
    budget_range: str
    timeline: str
    images: List[str]
    status: RequestStatus
    created_at: datetime
    updated_at: datetime
    homeowner_name: str
    homeowner_email: str
    homeowner_phone: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return UserResponse(**user)

# Routes
@api_router.get("/")
async def root():
    return {"message": "Fetan Digital Platform API"}

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["password_hash"] = hashed_password
    user_obj = User(**user_dict)
    
    await db.users.insert_one(user_obj.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.id}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user_obj.dict())
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@api_router.post("/service-providers", response_model=ServiceProviderResponse)
async def create_service_provider(
    provider_data: ServiceProviderCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != UserRole.SERVICE_PROVIDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only service providers can create profiles"
        )
    
    # Check if provider already exists
    existing_provider = await db.service_providers.find_one({"user_id": current_user.id})
    if existing_provider:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service provider profile already exists"
        )
    
    provider_dict = provider_data.dict()
    provider_dict["user_id"] = current_user.id
    provider_obj = ServiceProvider(**provider_dict)
    
    await db.service_providers.insert_one(provider_obj.dict())
    
    # Return response with user info
    response_dict = provider_obj.dict()
    response_dict["user_name"] = current_user.name
    response_dict["user_email"] = current_user.email
    response_dict["user_phone"] = current_user.phone
    
    return ServiceProviderResponse(**response_dict)

@api_router.get("/service-providers", response_model=List[ServiceProviderResponse])
async def get_service_providers(category: Optional[ServiceCategory] = None):
    filter_dict = {}
    if category:
        filter_dict["categories"] = category
    
    providers = await db.service_providers.find(filter_dict).to_list(1000)
    
    # Get user info for each provider
    provider_responses = []
    for provider in providers:
        user = await db.users.find_one({"id": provider["user_id"]})
        if user:
            response_dict = provider.copy()
            response_dict["user_name"] = user["name"]
            response_dict["user_email"] = user["email"]
            response_dict["user_phone"] = user.get("phone")
            provider_responses.append(ServiceProviderResponse(**response_dict))
    
    return provider_responses

@api_router.get("/service-providers/{provider_id}", response_model=ServiceProviderResponse)
async def get_service_provider(provider_id: str):
    provider = await db.service_providers.find_one({"id": provider_id})
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service provider not found"
        )
    
    user = await db.users.find_one({"id": provider["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    response_dict = provider.copy()
    response_dict["user_name"] = user["name"]
    response_dict["user_email"] = user["email"]
    response_dict["user_phone"] = user.get("phone")
    
    return ServiceProviderResponse(**response_dict)

@api_router.post("/service-requests", response_model=ServiceRequestResponse)
async def create_service_request(
    request_data: ServiceRequestCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != UserRole.HOMEOWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only homeowners can create service requests"
        )
    
    request_dict = request_data.dict()
    request_dict["homeowner_id"] = current_user.id
    request_obj = ServiceRequest(**request_dict)
    
    await db.service_requests.insert_one(request_obj.dict())
    
    # Return response with user info
    response_dict = request_obj.dict()
    response_dict["homeowner_name"] = current_user.name
    response_dict["homeowner_email"] = current_user.email
    response_dict["homeowner_phone"] = current_user.phone
    
    return ServiceRequestResponse(**response_dict)

@api_router.get("/service-requests", response_model=List[ServiceRequestResponse])
async def get_service_requests(
    current_user: UserResponse = Depends(get_current_user),
    category: Optional[ServiceCategory] = None
):
    filter_dict = {}
    
    if current_user.role == UserRole.HOMEOWNER:
        filter_dict["homeowner_id"] = current_user.id
    elif current_user.role == UserRole.SERVICE_PROVIDER:
        # Service providers can see all requests
        pass
    
    if category:
        filter_dict["category"] = category
    
    requests = await db.service_requests.find(filter_dict).to_list(1000)
    
    # Get homeowner info for each request
    request_responses = []
    for request in requests:
        user = await db.users.find_one({"id": request["homeowner_id"]})
        if user:
            response_dict = request.copy()
            response_dict["homeowner_name"] = user["name"]
            response_dict["homeowner_email"] = user["email"]
            response_dict["homeowner_phone"] = user.get("phone")
            request_responses.append(ServiceRequestResponse(**response_dict))
    
    return request_responses

@api_router.get("/service-requests/{request_id}", response_model=ServiceRequestResponse)
async def get_service_request(request_id: str):
    request = await db.service_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service request not found"
        )
    
    user = await db.users.find_one({"id": request["homeowner_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    response_dict = request.copy()
    response_dict["homeowner_name"] = user["name"]
    response_dict["homeowner_email"] = user["email"]
    response_dict["homeowner_phone"] = user.get("phone")
    
    return ServiceRequestResponse(**response_dict)

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    total_users = await db.users.count_documents({})
    total_providers = await db.service_providers.count_documents({})
    total_requests = await db.service_requests.count_documents({})
    pending_requests = await db.service_requests.count_documents({"status": RequestStatus.PENDING})
    
    return {
        "total_users": total_users,
        "total_providers": total_providers,
        "total_requests": total_requests,
        "pending_requests": pending_requests
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()