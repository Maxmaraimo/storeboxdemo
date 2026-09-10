# Master landing page generator
import os

def build():
    parts = []
    # Part 1: Head & CSS
    parts.append("""{% extends "base.html" %}

{% block title %}{{ t.page_title }}{% endblock %}

{% block extra_head %}
<style>
    /* ============================================================ */
    /* STOREBOX PREMIUM GLASSMORPHISM & DESIGN SYSTEM               */
    /* ============================================================ */
    
    /* True Glassmorphism (Light Sections) */
    .glass-card {
        background: rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(226, 232, 240, 0.85);
        box-shadow: 0 10px 30px -5px rgba(124, 58, 237, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .glass-card:hover {
        background: rgba(255, 255, 255, 0.96);
        border-color: rgba(139, 92, 246, 0.45);
        box-shadow: 0 20px 40px -10px rgba(124, 58, 237, 0.12), 0 8px 20px -4px rgba(0, 0, 0, 0.04);
        transform: translateY(-2px);
    }

    /* True Glassmorphism (Dark Sections) */
    .glass-card-dark {
        background: rgba(18, 14, 40, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(139, 92, 246, 0.22);
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
    }

    /* Floating Pill Navbar */
    .glass-pill-nav {
        background: rgba(15, 10, 38, 0.85);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    /* Glass Badges in Hero */
    .glass-badge-hero {
        background: rgba(255, 255, 255, 0.07);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.3);
        transition: all 0.25s ease;
    }
    .glass-badge-hero:hover {
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(167, 139, 250, 0.4);
        transform: translateY(-1px);
    }

    /* 3D Perspective Canvas */
    .perspective-1200 { perspective: 1200px; }
    .transform-style-3d { transform-style: preserve-3d; }
    
    /* Clean micro-pattern */
    .bg-grid-violet-pattern {
        background-image: radial-gradient(rgba(124, 58, 237, 0.08) 1.2px, transparent 1.2px);
        background-size: 24px 24px;
    }

    /* Perspective 3D Grid Plane for Hero */
    .hero-perspective-grid {
        background-image: linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
        background-size: 40px 40px;
        mask-image: radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%);
        -webkit-mask-image: radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%);
    }

    /* Shimmer Button */
    .shimmer-btn {
        position: relative;
        overflow: hidden;
    }
    .shimmer-btn::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
            60deg,
            transparent,
            rgba(255, 255, 255, 0.25),
            transparent
        );
        transform: rotate(30deg);
        animation: shimmer-swipe 4s infinite;
    }
    @keyframes shimmer-swipe {
        0% { transform: translateX(-100%) rotate(30deg); }
        30%, 100% { transform: translateX(100%) rotate(30deg); }
    }

    /* Pulse animation for live orders */
    @keyframes live-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.03); opacity: 0.85; }
    }
    .animate-live-pulse {
        animation: live-pulse 2.5s ease-in-out infinite;
    }

    /* Typing animation dots */
    @keyframes typing-dot {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    .typing-dot {
        animation: typing-dot 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
</style>
{% endblock %}
""")
    return parts

print('Base structure initialized')
