"""
Clinic and healthcare facility directory for NurseAda.
Seed data covering major Nigerian states: teaching hospitals, general hospitals,
primary health centres, specialist centres, and private clinics.

By default this module serves clinics from an in-memory list. When
KNOWLEDGE_CLINICS_SOURCE=supabase and SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY
are set, it will instead read from the Supabase `clinics` table so the
directory can be managed dynamically.
"""
from __future__ import annotations

import os

from dataclasses import dataclass
from app.supabase_rest import fetch_rows, supabase_configured


@dataclass
class Clinic:
    id: str
    name: str
    address: str
    city: str
    state: str
    phone: str
    specialties: list[str]
    facility_type: str  # hospital, clinic, primary_health_center, specialist
    accepts_telemedicine: bool
    hours: str


CLINICS: list[Clinic] = [
    # ── Lagos ────────────────────────────────────────────────────────────
    Clinic(
        id="luth",
        name="Lagos University Teaching Hospital (LUTH)",
        address="Idi-Araba, Surulere",
        city="Lagos",
        state="Lagos",
        phone="+234-1-7600070",
        specialties=["general", "surgery", "paediatrics", "obstetrics", "cardiology", "oncology"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    Clinic(
        id="lasuth",
        name="Lagos State University Teaching Hospital (LASUTH)",
        address="1-5 Oba Akinjobi Way, Ikeja",
        city="Lagos",
        state="Lagos",
        phone="+234-1-7744775",
        specialties=["general", "surgery", "obstetrics", "orthopaedics"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    Clinic(
        id="reddington-vi",
        name="Reddington Hospital",
        address="12 Idowu Martins Street, Victoria Island",
        city="Lagos",
        state="Lagos",
        phone="+234-1-2710084",
        specialties=["general", "cardiology", "paediatrics", "radiology"],
        facility_type="clinic",
        accepts_telemedicine=True,
        hours="Mon-Sat 8:00-18:00",
    ),
    Clinic(
        id="lagoon-hospitals",
        name="Lagoon Hospitals",
        address="7 Tiamiyu Savage St, Victoria Island",
        city="Lagos",
        state="Lagos",
        phone="+234-1-2716900",
        specialties=["general", "paediatrics", "obstetrics", "emergency"],
        facility_type="clinic",
        accepts_telemedicine=True,
        hours="24/7",
    ),
    # ── Oyo ───────────────────────────────────────────────────────────
    Clinic(
        id="uch-ibadan",
        name="University College Hospital (UCH)",
        address="Queen Elizabeth Road, Mokola",
        city="Ibadan",
        state="Oyo",
        phone="+234-2-2411763",
        specialties=["general", "surgery", "paediatrics", "psychiatry", "obstetrics", "ophthalmology"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    Clinic(
        id="bowen-uth",
        name="Bowen University Teaching Hospital",
        address="Ogbomoso Road",
        city="Ogbomoso",
        state="Oyo",
        phone="+234-38-730170",
        specialties=["general", "surgery", "paediatrics", "obstetrics"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    # ── FCT / Abuja ──────────────────────────────────────────────────
    Clinic(
        id="nha-abuja",
        name="National Hospital Abuja",
        address="Plot 132, Central Business District",
        city="Abuja",
        state="FCT",
        phone="+234-9-5233441",
        specialties=["general", "surgery", "cardiology", "oncology", "paediatrics"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    Clinic(
        id="cedarcrest-abuja",
        name="Cedarcrest Hospitals",
        address="Apo District",
        city="Abuja",
        state="FCT",
        phone="+234-9-2910093",
        specialties=["general", "cardiology", "obstetrics", "orthopaedics"],
        facility_type="clinic",
        accepts_telemedicine=True,
        hours="Mon-Sat 8:00-20:00",
    ),
    # ── Kano ──────────────────────────────────────────────────────────
    Clinic(
        id="abuth-zaria",
        name="Ahmadu Bello University Teaching Hospital (ABUTH)",
        address="Shika, Zaria",
        city="Zaria",
        state="Kaduna",
        phone="+234-69-332681",
        specialties=["general", "surgery", "paediatrics", "obstetrics", "ophthalmology"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    Clinic(
        id="aminu-kano",
        name="Aminu Kano Teaching Hospital",
        address="Zaria Road, Kano",
        city="Kano",
        state="Kano",
        phone="+234-64-315587",
        specialties=["general", "surgery", "paediatrics", "obstetrics", "dermatology"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    # ── Rivers ────────────────────────────────────────────────────────
    Clinic(
        id="upth-portharcourt",
        name="University of Port Harcourt Teaching Hospital (UPTH)",
        address="East-West Road, Choba",
        city="Port Harcourt",
        state="Rivers",
        phone="+234-84-817327",
        specialties=["general", "surgery", "paediatrics", "obstetrics", "orthopaedics"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    Clinic(
        id="braithwaite-memorial",
        name="Braithwaite Memorial Specialist Hospital",
        address="Old GRA, Port Harcourt",
        city="Port Harcourt",
        state="Rivers",
        phone="+234-84-230754",
        specialties=["general", "obstetrics", "paediatrics", "emergency"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    # ── Enugu ─────────────────────────────────────────────────────────
    Clinic(
        id="unth-enugu",
        name="University of Nigeria Teaching Hospital (UNTH)",
        address="Ituku-Ozalla",
        city="Enugu",
        state="Enugu",
        phone="+234-42-256027",
        specialties=["general", "surgery", "paediatrics", "obstetrics", "cardiology"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    # ── Edo ────────────────────────────────────────────────────────────
    Clinic(
        id="ubth-benin",
        name="University of Benin Teaching Hospital (UBTH)",
        address="PMB 1111, Benin City",
        city="Benin City",
        state="Edo",
        phone="+234-52-600443",
        specialties=["general", "surgery", "paediatrics", "obstetrics", "psychiatry"],
        facility_type="hospital",
        accepts_telemedicine=False,
        hours="24/7",
    ),
    # ── Primary Health Centres (representative) ──────────────────────
    Clinic(
        id="phc-surulere",
        name="Surulere Primary Health Centre",
        address="Ojuelegba Road, Surulere",
        city="Lagos",
        state="Lagos",
        phone="+234-1-7600200",
        specialties=["general", "maternal", "immunization"],
        facility_type="primary_health_center",
        accepts_telemedicine=False,
        hours="Mon-Fri 8:00-16:00",
    ),
    Clinic(
        id="phc-wuse",
        name="Wuse General Hospital / PHC",
        address="Wuse Zone 4",
        city="Abuja",
        state="FCT",
        phone="+234-9-5230800",
        specialties=["general", "maternal", "immunization", "paediatrics"],
        facility_type="primary_health_center",
        accepts_telemedicine=False,
        hours="Mon-Fri 8:00-17:00",
    ),
    # ── Specialist / Private ──────────────────────────────────────────
    Clinic(
        id="eye-foundation-lagos",
        name="Eye Foundation Hospital",
        address="27 Isaac John St, GRA Ikeja",
        city="Lagos",
        state="Lagos",
        phone="+234-1-7910788",
        specialties=["ophthalmology"],
        facility_type="specialist",
        accepts_telemedicine=True,
        hours="Mon-Fri 8:00-17:00, Sat 9:00-14:00",
    ),
    Clinic(
        id="first-cardiology-lagos",
        name="First Cardiology Consultants",
        address="2a Tiamiyu Savage St, Victoria Island",
        city="Lagos",
        state="Lagos",
        phone="+234-1-2713370",
        specialties=["cardiology"],
        facility_type="specialist",
        accepts_telemedicine=True,
        hours="Mon-Fri 8:00-18:00",
    ),
]


CLINICS_SOURCE = (os.getenv("KNOWLEDGE_CLINICS_SOURCE") or "memory").strip().lower()


def _fetch_clinics_from_supabase(
    state: str = "",
    specialty: str = "",
    facility_type: str = "",
) -> list[dict] | None:
    """
    Read clinics from Supabase when configured.
    Falls back to None on any error so callers can use in-memory data.
    """
    if not supabase_configured():
        return None

    params: dict[str, str] = {"select": "*", "order": "state,city"}
    if state:
        params["state"] = f"eq.{state}"
    if facility_type:
        params["facility_type"] = f"eq.{facility_type}"

    rows = fetch_rows("clinics", params)
    if rows is None:
        return None

    # Only active clinics
    rows = [row for row in rows if row.get("is_active", True)]

    # Optional specialty filter (done in-process to keep PostgREST query simple)
    if specialty:
        sp = specialty.strip().lower()
        filtered: list[dict] = []
        for row in rows:
            specs = row.get("specialties") or []
            if any(sp in str(s).lower() for s in specs):
                filtered.append(row)
        rows = filtered

    return [
        {
            "id": row.get("id", ""),
            "name": row.get("name", ""),
            "address": row.get("address", ""),
            "city": row.get("city", ""),
            "state": row.get("state", ""),
            "phone": row.get("phone", ""),
            "specialties": row.get("specialties") or [],
            "facility_type": row.get("facility_type", ""),
            "accepts_telemedicine": bool(row.get("accepts_telemedicine", False)),
            "hours": row.get("hours", ""),
        }
        for row in rows
    ]


def get_clinic_directory(
    state: str = "",
    specialty: str = "",
    facility_type: str = "",
) -> list[dict]:
    """
    Return clinics, optionally filtered by state, specialty, or facility type.

    When KNOWLEDGE_CLINICS_SOURCE=supabase and Supabase is configured, this
    reads from the `clinics` table. Otherwise, it uses the in-memory CLINICS
    list defined above.
    """
    if CLINICS_SOURCE == "supabase" and supabase_configured():
        rows = _fetch_clinics_from_supabase(state=state, specialty=specialty, facility_type=facility_type)
        if rows is not None:
            return rows

    results = CLINICS
    if state:
        s = state.strip().lower()
        results = [c for c in results if s in c.state.lower()]
    if specialty:
        sp = specialty.strip().lower()
        results = [c for c in results if any(sp in s for s in c.specialties)]
    if facility_type:
        ft = facility_type.strip().lower()
        results = [c for c in results if ft in c.facility_type.lower()]
    return [_clinic_to_dict(c) for c in results]


def search_clinics(query: str) -> list[dict]:
    """Free-text search across clinic name, city, state, specialties."""
    q = (query or "").strip().lower()
    if not q or len(q) < 2:
        return [_clinic_to_dict(c) for c in CLINICS]
    results: list[Clinic] = []
    for c in CLINICS:
        searchable = f"{c.name} {c.city} {c.state} {' '.join(c.specialties)} {c.facility_type}".lower()
        if q in searchable:
            results.append(c)
    return [_clinic_to_dict(c) for c in results]


def _clinic_to_dict(c: Clinic) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "address": c.address,
        "city": c.city,
        "state": c.state,
        "phone": c.phone,
        "specialties": c.specialties,
        "facility_type": c.facility_type,
        "accepts_telemedicine": c.accepts_telemedicine,
        "hours": c.hours,
    }
