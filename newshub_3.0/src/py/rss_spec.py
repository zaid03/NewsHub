import feedparser
from bs4 import BeautifulSoup
from datetime import datetime, timezone
from db_connection import create_connection

def time_ago(published_time):
    now = datetime.now(timezone.utc)
    diff = now - published_time

    if diff.days > 0:
        if diff.days == 1:
            return "1 day ago"
        return f"{diff.days} days ago"
    elif diff.seconds >= 3600:
        hours = diff.seconds // 3600
        if hours == 1:
            return "1 hour ago"
        return f"{hours} hours ago"
    elif diff.seconds >= 60:
        minutes = diff.seconds // 60
        if minutes == 1:
            return "1 minute ago"
        return f"{minutes} minutes ago"
    else:
        return "Just now"

def fetch_and_store_news():
    conn = create_connection()
    cursor = conn.cursor()

    if conn is None:
        print("failed to connect to DB")
        return

    RSS_URL = {
       #general news
        "Afrique" : "https://www.france24.com/fr/rss",

    }

    for category, url in RSS_URL.items():
        feed = feedparser.parse(url)

        for entry in feed.entries:
            title = entry.title
            link = entry.link

            source = "boogieman"
            if hasattr(entry, 'source') and isinstance(entry.source, dict):
                source = entry.source.get('title', "boogieman")

            try:
                published = datetime.strptime(entry.published, "%a, %d %b %Y %H:%M:%S %Z")
                if published.tzinfo is None: 
                    published = published.replace(tzinfo=timezone.utc)
            except (AttributeError, ValueError):
                published = datetime.now(timezone.utc) 

            published_relative = time_ago(published)

            if "summary" in entry:
                soup = BeautifulSoup(entry.summary, 'html.parser')
                summary = soup.get_text()[:200] + "..." if len(soup.get_text()) > 200 else soup.get_text()
            else:
                summary = "Pas de description"
            print(f"Cleaned summary for {category}: {summary}")
            

            image = None
            if 'media_content' in entry:
                for media in entry.media_content:
                    if 'url' in media:
                        image = media['url']
                        break
            elif 'enclosures' in entry:
                for enclosure in entry.enclosures:
                    if enclosure.type.startswith("image"):
                        image = enclosure.url
                        break
            
            image = image or 'walo'

            cursor.execute("SELECT id FROM news WHERE link = %s", (link,))
            if not cursor.fetchone():
                cursor.execute(
                    "INSERT INTO news (category_name, title, link, source, image, published, summary) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (category, title, link, source, image, published_relative, summary)
                )
    
    cursor.execute("DELETE FROM news WHERE published REGEXP '^[7-9][0-9]* days ago$' OR published REGEXP '^[1-9][0-9]{2,} days ago$';")
    conn.commit()
    cursor.close()
    conn.close()

fetch_and_store_news()