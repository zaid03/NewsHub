import feedparser
from db_connection import create_connection

def fetch_and_store_news():
    conn = create_connection()
    cursor = conn.cursor()

    RSS_URL = {
        "General": [
            "https://feeds.bbci.co.uk/news/world/rss.xml",
        ],
    }

    for category, urls in RSS_URL.items():
        for url in urls:
            feed = feedparser.parse(url)
            for entry in feed.entries:
                image = None

                if 'media_content' in entry:
                    for media in entry.media_content:
                        if 'url' in media:
                            image = media['url']
                            break

                if 'enclosures' in entry:
                    for enclosure in entry.enclosures:
                        if enclosure.type.startswith("image"):
                            image = enclosure.url
                            break

                if 'media_thumbnail' in entry:
                    for thumb in entry.media_thumbnail:
                        if 'url' in thumb:
                            image = thumb['url']
                            break

                cursor.execute("INSERT INTO bbc_image (image) VALUES (%s)", (image,))

    conn.commit()
    cursor.close()
    conn.close()

fetch_and_store_news()