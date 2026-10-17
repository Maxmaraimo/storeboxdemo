from django.core.paginator import Paginator


def _positive_integer(value, default, maximum=None):
    try:
        number = max(1, int(value))
    except (TypeError, ValueError):
        number = default
    return min(number, maximum) if maximum else number


def paginate_queryset(request, queryset, *, default_limit, allow_limit=False, focus=None):
    """Opt in with ?page= so existing API consumers keep their list response."""
    if "page" not in request.GET:
        limit = _positive_integer(request.GET.get("limit"), default_limit, 1000) if allow_limit else default_limit
        return queryset[:limit], {"total": queryset.count()}

    page_size = _positive_integer(request.GET.get("page_size"), 10, 100)
    page_number = _positive_integer(request.GET.get("page"), 1)
    if focus is not None:
        # All paginated lists use newest first, with id as a stable tiebreaker.
        from django.db.models import Q
        before_focus = queryset.filter(
            Q(created_at__gt=focus.created_at) |
            Q(created_at=focus.created_at, id__gt=focus.id)
        ).count()
        page_number = before_focus // page_size + 1

    paginator = Paginator(queryset, page_size)
    page = paginator.get_page(page_number)
    return page.object_list, {
        "total": paginator.count,
        "page": page.number,
        "page_size": page_size,
        "total_pages": paginator.num_pages,
    }
