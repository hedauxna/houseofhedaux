import os
from flask import Flask, render_template, request, abort
from datetime import datetime

def get_last_updated():
    try:
        with open("/mnt/c/Users/natha/HouseOfHedaux/last_updated.txt", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "Unknown"

app = Flask(__name__)

SKYWATCH_FOLDER = os.path.join('static', 'skywatch')
VALID_CATEGORIES = ['review', 'bird', 'blank', 'cloud', 'plane', 'unknown']

# --- Blueprint zone positions (percentages on the blueprint image) ---
# Decorative zone with no linked page
DECORATIVE_ZONES = [
    {
        'css_class': 'tree-zone',
        'label': 'Garden',
        'title': 'Family Tree',
        'left': '17%',
        'top': '23.5%',
    },
]

# All navigable rooms — order matches the original index.html layout
PAGES = {
    'garage': {
        'header_title': 'Garage',
        'header_subtitle': 'My Tesla Journey: A Dream in Motion',
        'title_tag': 'The Garage | House of Hedaux',
        'zone_label': 'Garage',
        'zone_title': 'Tesla',
        'css_class': 'tesla-zone',
        'zone_left': '79%',
        'zone_top': '18%',
    },
    'foyer': {
        'header_title': 'Foyer',
        'header_subtitle': 'The Threshold of Legacy',
        'title_tag': 'The Foyer | House of Hedaux',
        'zone_label': 'Foyer',
        'zone_title': 'About',
        'css_class': 'welcome-zone',
        'zone_left': '41.5%',
        'zone_top': '46%',
    },
    'career': {
        'template': 'study.html',
        'header_title': 'The Study',
        'header_subtitle': 'Where the journey unfolds',
        'title_tag': 'The Foyer | House of Hedaux',
        'zone_label': 'Study',
        'zone_title': 'My Career',
        'css_class': 'career-zone',
        'zone_left': '20%',
        'zone_top': '52.5%',
    },
    'library': {
        'header_title': 'The Library',
        'header_subtitle': '',
        'title_tag': 'The Library | House of Hedaux',
        'zone_label': 'Library',
        'zone_title': 'Hedaux Tome',
        'css_class': 'library-zone',
        'zone_left': '29.5%',
        'zone_top': '52.5%',
    },
    'abi': {
        'header_title': 'The Room of Abi',
        'header_subtitle': 'First Light in the Mansion',
        'title_tag': 'Abi | House of Hedaux',
        'zone_label': 'Bedroom 2',
        'zone_title': 'Abi',
        'css_class': 'abi-zone',
        'zone_left': '53.5%',
        'zone_top': '53%',
    },
    'josh': {
        'header_title': 'The Room of Josh',
        'header_subtitle': 'Spark Beneath the Storm',
        'title_tag': 'Josh | House of Hedaux',
        'zone_label': 'Bedroom 3',
        'zone_title': 'Josh',
        'css_class': 'josh-zone',
        'zone_left': '83%',
        'zone_top': '53%',
    },
    'aaron': {
        'header_title': 'The Room of Aaron',
        'header_subtitle': 'Built in Silence, Wired for Wonder',
        'title_tag': 'Aaron | House of Hedaux',
        'zone_label': 'Bedroom 4',
        'zone_title': 'Aaron',
        'css_class': 'aaron-zone',
        'zone_left': '83%',
        'zone_top': '72%',
    },
    'phoebe': {
        'header_title': 'Phoebe',
        'header_subtitle': 'Coming Soon',
        'title_tag': 'Phoebe | House of Hedaux',
        'zone_label': 'Bedroom 5',
        'zone_title': 'Phoebe Dance',
        'css_class': 'phoebe-zone',
        'zone_left': '69.5%',
        'zone_top': '53%',
    },
    'pergola': {
        'header_title': 'Under the Pergola',
        'header_subtitle': 'Smashes, Spins, and Garden Wins',
        'title_tag': 'The Pergola | House of Hedaux',
        'zone_label': 'Pergola',
        'zone_title': 'Table Tennis',
        'css_class': 'pergola-zone',
        'zone_left': '41.5%',
        'zone_top': '80%',
    },
    'travel': {
        'header_title': 'The Travel Log Room',
        'header_subtitle': 'Summer Road Trip to Verdon – 2025',
        'title_tag': 'The Travel Log Room | House of Hedaux',
        'zone_label': 'Travel',
        'zone_title': 'The Travel Log Room',
        'css_class': 'travel-zone',
        'zone_left': '79%',
        'zone_top': '30%',
    },
    'conservatory': {
        'header_title': 'The Conservatory',
        'header_subtitle': 'Coming Soon',
        'title_tag': 'Conservatory | House of Hedaux',
        'zone_label': 'Conservatory',
        'zone_title': 'The Conservatory',
        'css_class': 'bonsai-zone',
        'zone_left': '26.5%',
        'zone_top': '72%',
    },
    'masterbedroom': {
        'header_title': 'The Master Bedroom',
        'header_subtitle': 'Coming Soon',
        'title_tag': 'Master Bedroom | House of Hedaux',
        'zone_label': 'Master Bedroom',
        'zone_title': 'Master Bedroom',
        'css_class': 'masterbedroom-zone',
        'zone_left': '60%',
        'zone_top': '72%',
    },
    'gamesroom': {
        'header_title': 'The Games Room',
        'header_subtitle': 'Where pixels become portals and code becomes legacy',
        'title_tag': 'The Games Room | House of Hedaux',
        'zone_label': 'Games Room',
        'zone_title': 'The Games Room',
        'css_class': 'gamesroom-zone',
        'zone_left': '10.5%',
        'zone_top': '52.5%',
    },
    'kitchen': {
        'header_title': 'The Kitchen',
        'header_subtitle': 'Coming Soon',
        'title_tag': 'The Kitchen | House of Hedaux',
        'zone_label': 'The Kitchen',
        'zone_title': 'The Kitchen',
        'css_class': 'kitchen-zone',
        'zone_left': '41.5%',
        'zone_top': '68%',
    },
    'pets': {
        'header_title': 'Pets',
        'header_subtitle': 'Coming Soon',
        'title_tag': 'Pet Zone | House of Hedaux',
        'zone_label': 'Pet Zone',
        'zone_title': 'Pet Zone',
        'css_class': 'pets-zone',
        'zone_left': '61.5%',
        'zone_top': '39%',
    },
    'skywatch': {
        'header_title': 'Skywatch',
        'header_subtitle': 'A Window to the Ever-Changing Canvas Above',
        'title_tag': 'Skywatch Observatory | House of Hedaux',
        'zone_label': 'Observatory',
        'zone_title': 'Skywatch',
        'css_class': 'skywatch-zone',
        'zone_left': '13%',
        'zone_top': '72%',
    },
}

# Pages handled by the generic room route (all except library/skywatch which have special logic)
GENERIC_PAGES = {
    slug: meta for slug, meta in PAGES.items()
    if slug not in ('library', 'skywatch')
}


@app.route('/')
def home():
    return render_template('index.html', pages=PAGES, decorative_zones=DECORATIVE_ZONES)


@app.route('/<page>')
def room(page):
    if page not in GENERIC_PAGES:
        abort(404)
    meta = GENERIC_PAGES[page]
    template = meta.get('template', page + '.html')
    return render_template(template, **meta)


@app.route('/skywatch')
def skywatch():
    meta = PAGES['skywatch']
    return render_template(
        'skywatch.html',
        active_page='skywatch',
        last_updated=get_last_updated(),
        **meta
    )


@app.route('/swgallery')
def swgallery():
    today_str = datetime.now().strftime('%Y%m%d')
    category = request.args.get('category', '').lower()
    base_folder = os.path.join(SKYWATCH_FOLDER, 'sorted')
    images = []

    if category in VALID_CATEGORIES:
        image_folder = os.path.join(base_folder, category)
        if os.path.exists(image_folder):
            images = [
                f"{category}/{f}" for f in os.listdir(image_folder)
                if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))
            ]
            images.sort(reverse=True)
    else:
        for cat in VALID_CATEGORIES:
            folder = os.path.join(base_folder, cat)
            if os.path.exists(folder):
                for f in os.listdir(folder):
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
                        images.append(f"{cat}/{f}")
        images.sort(reverse=True)

    return render_template(
        'swgallery.html',
        active_page='swgallery',
        images=images,
        category=category,
        last_updated=get_last_updated(),
        today_str=today_str
    )


@app.route('/library')
def library():
    meta = PAGES['library']
    return render_template('library.html', last_updated=datetime.now().strftime("%B %d, %Y"), **meta)


if __name__ == '__main__':
    app.run(debug=True)
