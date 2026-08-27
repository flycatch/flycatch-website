from __future__ import annotations

from enum import StrEnum

CLOUD_PAGE_NAMES = (
    "cloud-services",
    "cloud-consultation",
    "cloud-migration",
    "hybrid-cloud",
    "cloud-security",
    "cloud-optimization",
)

DATA_PAGE_NAMES = (
    "data-management",
    "data-management-strategy",
    "data-engineering",
    "visualization-and-intelligence",
    "data-migration",
    "big-data-analytics",
)

PAGE_NAMES = CLOUD_PAGE_NAMES


class PageName(StrEnum):
    cloud_services = "cloud-services"
    cloud_consultation = "cloud-consultation"
    cloud_migration = "cloud-migration"
    hybrid_cloud = "hybrid-cloud"
    cloud_security = "cloud-security"
    cloud_optimization = "cloud-optimization"
    data_management = "data-management"
    data_management_strategy = "data-management-strategy"
    data_engineering = "data-engineering"
    visualization_and_intelligence = "visualization-and-intelligence"
    data_migration = "data-migration"
    big_data_analytics = "big-data-analytics"
