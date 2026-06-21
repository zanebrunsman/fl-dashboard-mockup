#!/usr/bin/env python3
"""Build radar_card.yaml + radar_fs_card.yaml with srcdoc iframe inline.

The iframe srcdoc approach embeds the full radar.html inside the YAML directly,
which means NO /config/www/ filesystem dependency. This sidesteps Docker bind mount
issues with the SSH add-on container.

Run locally; commits results to workspace files.
"""
import os, json, html

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "..", "www", "radar.html"))
DASH = os.path.normpath(os.path.join(HERE, "..", "dashboard"))

with open(SRC) as f:
    radar_html = f.read()

# Escape for HTML attribute (srcdoc): & → &amp;, " → &quot;
def attr_escape(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")

# Actually srcdoc spec: only & and " need escaping (it parses HTML inside). But for
# safety inside YAML and the html-template-card content (which is interpolated),
# we'll use &quot; for double quotes and pass the rest through.
# html-template-card uses Jinja2-like syntax but with `ignore_line_breaks: true` and
# raw content, no interpolation. We render with " quote so we use &quot; for inner ".

def srcdoc_escape(s):
    # Per HTML5 spec, srcdoc accepts ANY HTML; need to escape only the attribute
    # delimiter. We use double-quote delimiter, so escape " → &quot; and & → &amp;.
    # Convert newlines to HTML char entity &#10; so the whole attribute fits on one
    # YAML line but JS line comments still terminate correctly when the browser
    # decodes the srcdoc attribute.
    s = s.replace("&", "&amp;").replace('"', "&quot;")
    s = s.replace("\r\n", "&#10;").replace("\n", "&#10;").replace("\t", " ")
    return s

esc = srcdoc_escape(radar_html)

# Patch the source to set ?embed=1 behavior or fullscreen behavior via a window flag.
# Easier: emit two variants where we substitute the query param parsing.
embed_html = radar_html.replace(
    "var qp = new URLSearchParams(window.location.search);",
    "var qp = new URLSearchParams(window.__radarMode === 'embed' ? '?embed=1' : '');"
).replace(
    "window.__radarMode === 'embed' ? '?embed=1' : ''",
    "window.__radarMode === 'embed' ? '?embed=1' : ''"
)
# Insert window.__radarMode setter at top of script
embed_html_set = embed_html.replace("<script>\n(function(){",
                                     "<script>\nwindow.__radarMode='embed';\n(function(){")
fs_html_set    = embed_html.replace("<script>\n(function(){",
                                     "<script>\nwindow.__radarMode='fs';\n(function(){")

def build_card(srcdoc_html, card_id, height_css, mode_label):
    esc = srcdoc_escape(srcdoc_html)
    return f"""# why: Iframe srcdoc keeps the radar HTML inline in YAML (no filesystem dep).
# This sidesteps Docker bind-mount issues with the SSH add-on /config/www/ path.
# A bridge script syncs HA state (lightning strikes, ring radii, theme) into the
# iframe via postMessage every 5s.
type: custom:html-template-card
ignore_line_breaks: true
content: |
  <div style="position:relative;width:100%;height:{height_css};border-radius:14px;overflow:hidden;background:#0b1929;">
    <iframe id="{card_id}" srcdoc="{esc}" style="border:0;width:100%;height:100%;display:block;" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"></iframe>
  </div>
  <script>
    (function(){{
      if (window.__radarBridge_{card_id.replace('-','_')}) return;
      window.__radarBridge_{card_id.replace('-','_')} = true;
      var pickIframe = function(){{ return document.getElementById('{card_id}'); }};
      var send = function(){{
        var ifr = pickIframe(); if (!ifr || !ifr.contentWindow) return;
        var hass = document.querySelector('home-assistant') && document.querySelector('home-assistant').hass;
        if (!hass) return;
        var strikes = [];
        Object.keys(hass.states).forEach(function(eid){{
          if (!eid.startsWith('geo_location.lightning_strike_')) return;
          var s = hass.states[eid];
          strikes.push({{ lat: s.attributes.latitude, lon: s.attributes.longitude, t: s.attributes.publication_date }});
        }});
        var aud = hass.states['input_number.lightning_audible_radius_mi'];
        var vis = hass.states['input_number.lightning_visual_radius_mi'];
        var audEn = hass.states['input_boolean.lightning_audible_ring_enabled'];
        var visEn = hass.states['input_boolean.lightning_visual_ring_enabled'];
        var bg = getComputedStyle(document.documentElement).getPropertyValue('--primary-background-color').trim();
        var m = bg.match(/#([0-9a-f]{{6}})/i);
        var theme = 'light';
        if (m) {{
          var r = parseInt(m[1].substr(0,2),16), g = parseInt(m[1].substr(2,2),16), b = parseInt(m[1].substr(4,2),16);
          theme = (r*0.299+g*0.587+b*0.114) < 128 ? 'dark' : 'light';
        }}
        ifr.contentWindow.postMessage({{
          type: 'radar-update', strikes: strikes,
          aud: aud ? parseFloat(aud.state) : undefined,
          vis: vis ? parseFloat(vis.state) : undefined,
          audOn: audEn ? audEn.state === 'on' : undefined,
          visOn: visEn ? visEn.state === 'on' : undefined,
          theme: theme
        }}, '*');
      }};
      window.addEventListener('message', function(ev){{
        if (ev.data && ev.data.type === 'radar-ready') send();
      }});
      setInterval(send, 5000);
      setTimeout(send, 1500);
    }})();
  </script>
"""

embed_card = build_card(embed_html_set, "radar-iframe", "480px", "embed")
fs_card    = build_card(fs_html_set,    "radar-iframe-fs", "calc(100vh - 56px)", "fs")

with open(os.path.join(DASH, "radar_card.yaml"), "w") as f:
    f.write(embed_card)
print(f"wrote {os.path.join(DASH, 'radar_card.yaml')} ({len(embed_card)} bytes)")

with open(os.path.join(DASH, "radar_fs_card.yaml"), "w") as f:
    f.write(fs_card)
print(f"wrote {os.path.join(DASH, 'radar_fs_card.yaml')} ({len(fs_card)} bytes)")
