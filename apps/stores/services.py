import math
from apps.stores.models import Branch

def haversine_distance_km(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees) using Haversine formula.
    """
    try:
        lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
    except (ValueError, TypeError):
        return None

    # convert decimal degrees to radians 
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.asin(math.sqrt(a))
    # Radius of earth in kilometers. Use 6371
    r = 6371.0
    return round(c * r, 2)


def find_optimal_branch(store, lat=None, lng=None, preferred_branch_id=None):
    """
    Finds the optimal branch for an order:
    1. If preferred_branch_id is specified (e.g. customer explicitly chose pickup branch),
       verify if it's active and belongs to the store.
    2. Check open / accepting orders branches.
    3. If lat & lng are given, calculate distances and pick the closest open branch.
       If the closest branch is closed (is_active=False or is_accepting_orders=False),
       the next closest open branch is automatically picked.
    4. Fallbacks gracefully if no coordinates or no open branches.
    Returns: (branch, distance_km)
    """
    all_branches = store.branches.all()
    if not all_branches.exists():
        return None, None

    # Check preferred branch
    if preferred_branch_id:
        try:
            pref = all_branches.filter(id=int(preferred_branch_id)).first()
            if pref and pref.is_active and pref.is_accepting_orders:
                dist = None
                if lat is not None and lng is not None and pref.latitude and pref.longitude:
                    dist = haversine_distance_km(lat, lng, pref.latitude, pref.longitude)
                return pref, dist
        except (ValueError, TypeError):
            pass

    # Open branches taking orders and currently within schedule
    active_accepting = list(all_branches.filter(is_active=True, is_accepting_orders=True))
    open_branches = [b for b in active_accepting if b.is_currently_open()[0]]

    # If no branch is currently within working hours, fallback to active accepting branches, then any active branch
    candidate_branches = open_branches if open_branches else active_accepting
    if not candidate_branches:
        candidate_branches = list(all_branches.filter(is_active=True)) or list(all_branches)

    if not candidate_branches:
        return None, None

    # If coordinates are available, find the closest candidate
    if lat is not None and lng is not None:
        try:
            lat = float(lat)
            lng = float(lng)
            ranked = []
            for b in candidate_branches:
                b_lat = getattr(b, 'latitude', None)
                b_lng = getattr(b, 'longitude', None)
                if b_lat is not None and b_lng is not None:
                    dist = haversine_distance_km(lat, lng, b_lat, b_lng)
                    if dist is not None:
                        ranked.append((b, dist))
                    else:
                        ranked.append((b, 999999.0))
                else:
                    ranked.append((b, 999999.0))

            if ranked:
                ranked.sort(key=lambda x: x[1])
                best_branch, best_dist = ranked[0]
                return best_branch, (best_dist if best_dist < 900000 else None)
        except (ValueError, TypeError):
            pass

    # Default to main branch or first candidate
    main_branch = next((b for b in candidate_branches if b.is_main), candidate_branches[0])
    return main_branch, None
