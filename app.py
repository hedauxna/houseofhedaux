import os
from flask import Flask, render_template, request, redirect
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

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/garage')
def garage():
    return render_template('garage.html')

@app.route('/foyer')
def foyer():
    return render_template('foyer.html')

@app.route('/career')
def career():
    return render_template('study.html')

@app.route('/abi')
def abi():
    return render_template('abi.html')

@app.route('/josh')
def josh():
    return render_template('josh.html')

@app.route('/aaron')
def aaron():
    return render_template('aaron.html')

@app.route('/phoebe')
def phoebe():
    return redirect("https://phoebedance.com")

@app.route('/library')
def library():
    return render_template('library.html', last_updated=datetime.now().strftime("%B %d, %Y"))

@app.route('/skywatch')
def skywatch():
    return render_template('skywatch.html', active_page='skywatch', last_updated=get_last_updated())

@app.route('/pergola')
def pergola():
    return render_template('pergola.html')

@app.route('/travel')
def travel():
    return render_template('travel.html')

@app.route('/conservatory')
def conservatory():
    return render_template('conservatory.html')

@app.route('/masterbedroom')
def masterbedroom():
    return render_template('masterbedroom.html')

@app.route('/gamesroom')
def gamesroom():
    return render_template('gamesroom.html')

@app.route('/kitchen')
def kitchen():
    return render_template('kitchen.html')

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
        active_page='swgallery.html',
        images=images,
        category=category,
        last_updated=get_last_updated(),
        today_str=today_str
        )

    print(f"Category: {category}, Images found: {len(images)}")
    return render_template('swgallery.html', active_page='swgallery.html', images=images, category=category, last_updated=get_last_updated())

if __name__ == '__main__':
    app.run(debug=True)