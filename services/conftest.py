"""Shared pytest fixtures for NurseAda backend services."""

from __future__ import annotations

from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient


PROJECT_ROOT = Path(__file__).resolve().parent


def _ensure_path(path: Path) -> None:
  p = str(path)
  if p not in sys.path:
    sys.path.insert(0, p)


@pytest.fixture(scope="session")
def gateway_client() -> TestClient:
  """FastAPI TestClient for the gateway service."""
  gateway_root = PROJECT_ROOT / "gateway"
  _ensure_path(gateway_root)
  from app.main import app

  return TestClient(app)


@pytest.fixture(scope="session")
def cdss_client() -> TestClient:
  """FastAPI TestClient for the CDSS service."""
  cdss_root = PROJECT_ROOT / "cdss"
  _ensure_path(cdss_root)
  from app.main import app

  return TestClient(app)


@pytest.fixture(scope="session")
def fhir_client() -> TestClient:
  """FastAPI TestClient for the FHIR adapter service."""
  fhir_root = PROJECT_ROOT / "fhir-adapter"
  _ensure_path(fhir_root)
  from app.main import app

  return TestClient(app)

