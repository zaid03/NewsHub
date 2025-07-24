import feedparser
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from db_connection import create_connection

def empty_database():
    conn= create_connection()
    cursor = conn.cursor()
    if conn is None:
        print("failed to connect to DB")
        return
    
    cursor.execute(
        """
        DELETE FROM news
        WHERE (
            (STR_TO_DATE(published, '%Y-%m-%d %H:%i:%s.%f') IS NOT NULL AND STR_TO_DATE(published, '%Y-%m-%d %H:%i:%s.%f') < NOW() - INTERVAL 15 DAY)
            OR
            (STR_TO_DATE(published, '%Y-%m-%d %H:%i:%s') IS NOT NULL AND STR_TO_DATE(published, '%Y-%m-%d %H:%i:%s') < NOW() - INTERVAL 15 DAY)
        )
        """
    )

    print("Database emptied successfully")
    conn.commit()
    cursor.close()
    conn.close()

def fetch_and_store_news():
    conn = create_connection()
    cursor = conn.cursor()

    if conn is None:
        print("failed to connect to DB")
        return

    RSS_URL = {
        "General" : [
            "https://feeds.bbci.co.uk/news/world/rss.xml",
            "https://rss.nytimes.com/services/xml/rss/nyt/World.xml"
        ],

        "International" : [
            "https://abcnews.go.com/abcnews/internationalheadlines",
            "https://feeds.content.dowjones.io/public/rss/RSSWorldNews"
        ],

        "Local" : [
            "https://lematin.ma/rssFeed/2",
            "https://lematin.ma/rssFeed/3",
            "https://lematin.ma/rssFeed/27",
            "https://lematin.ma/rssFeed/28",
            "https://fr.hespress.com/feed"
        ],

        "Politics" : [
            "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
            "https://abcnews.go.com/abcnews/politicsheadlines",
            "https://feeds.bbci.co.uk/news/politics/rss.xml"
        ],

        "Business & Finance" : [
            "https://feeds.content.dowjones.io/public/rss/socialeconomyfeed",
            "https://abcnews.go.com/abcnews/moneyheadlines",
            "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
            "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml",
        ],

        "Tech & Innovation" : [
            "https://feeds.feedburner.com/TechCrunch/",
            "https://feeds.arstechnica.com/arstechnica/science",
            "https://www.computerweekly.com/rss/Latest-IT-news.xml",
            "https://www.computerweekly.com/rss/IT-management.xml",
            "https://www.computerweekly.com/rss/Enterprise-software.xml",
            "https://www.computerweekly.com/rss/IT-security.xml",
            "https://www.computerweekly.com/rss/Financial-services-IT-news.xml",
            "https://feeds.content.dowjones.io/public/rss/RSSWSJD",
            "https://abcnews.go.com/abcnews/technologyheadlines",
            "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"
        ],

        "Earth & Universe" : [
            "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
            "https://www.nasa.gov/news-release/feed/",
            "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml",
            "https://rss.nytimes.com/services/xml/rss/nyt/Climate.xml"
        ],

        "Health" : [
            "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml",
            "https://feeds.content.dowjones.io/public/rss/socialhealth"
        ],

        "Fashion" : [
            "https://www.newyorker.com/feed/articles",
            "https://www.harpersbazaararabia.com/rss",
            "https://rss.nytimes.com/services/xml/rss/nyt/FashionandStyle.xml"
        ],

        "Travel" : [
            "https://rss.nytimes.com/services/xml/rss/nyt/Travel.xml"
        ],

        "Food" : [
            "https://rss.nytimes.com/services/xml/rss/nyt/DiningandWine.xml"
        ],

        "Sports" : [
            "https://www.espn.com/espn/rss/news",
            "https://abcnews.go.com/abcnews/sportsheadlines",
            "https://rss.nytimes.com/services/xml/rss/nyt/Soccer.xml"
        ],

        "Gaming" : [
            "https://www.polygon.com/rss/index.xml"
        ],

        "Real Estate" : [
            "https://rss.nytimes.com/services/xml/rss/nyt/RealEstate.xml"
        ],

        "Middle East" : [
            "https://rss.nytimes.com/services/xml/rss/nyt/MiddleEast.xml"
        ],

        "Africa" : [
            "https://rss.nytimes.com/services/xml/rss/nyt/Africa.xml"
        ],

        "EU" : [
            "http://rss.nytimes.com/services/xml/rss/nyt/Europe.xml"
        ],

        "US" : [
            "http://rss.nytimes.com/services/xml/rss/nyt/US.xml"
        ],
    }

    for category, urls in RSS_URL.items():
        for url in urls:
            feed = feedparser.parse(url)

            for entry in feed.entries:
                title = entry.title
                link = entry.link

                default_source = "Missing source"

                if hasattr(entry, 'source') and isinstance(entry.source, dict):
                    source = entry.source.get('title', default_source)
                elif hasattr(entry, 'link'):
                    domain = urlparse(entry.link).netloc
                    domain = domain.replace('www.', '')

                    source_map = {
                        'nytimes.com': 'The New York Times',
                        'bbc.com': 'BBC News',
                        'polygon.com': 'Polygon',
                        'abcnews.go.com': 'ABC news',
                        'espn.com': 'ESPN',
                        'harpersbazaararabia.com': 'Harpers Bazaar Arabia',
                        'wsj.com': 'Dow Jones',
                        'nasa.gov': 'Nasa',
                        'computerweekly.com': 'Computer Weekly',
                        'arstechnica.com': 'Arstechnica',
                        'techncruncher.blogspot.com': 'TechCrunch',
                        'lematin.ma': 'Le Matin',
                        'fr.hespress.com': 'Hespress',
                    }

                    source = source_map.get(domain, domain)
                else:
                    source = default_source

                try:
                    published = parsedate_to_datetime(entry.published)
                    if published.tzinfo is None:
                        published = published.replace(tzinfo=timezone.utc)
                except Exception:
                    published = datetime.now(timezone.utc)

                published_str = published.strftime('%Y-%m-%d %H:%M:%S')

                if "summary" in entry:
                    soup = BeautifulSoup(entry.summary, 'html.parser')
                    summary_text = soup.get_text()
                    summary = summary_text[:200] + "..." if len(summary_text) > 200 else summary_text
                else:
                    summary = "No description"

                print(f"Cleaned summary for {category}: {summary}")

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

                cursor.execute("SELECT id FROM news WHERE link = %s", (link,))

                if not cursor.fetchone():
                    cursor.execute(
                        "INSERT INTO news (category_name, title, link, source, image, published, summary) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (category, title, link, source, image, published_str, summary)
                    )
    cursor.close()
    conn.commit()
    print(f"Inserted: {title}")
    conn.close()

fetch_and_store_news()
empty_database()