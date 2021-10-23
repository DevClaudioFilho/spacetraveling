import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';
import { differenceInSeconds, parseISO } from 'date-fns';
import Header from '../../components/Header';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  function calcTimeToRead() {
    const NumberWordsInTheHead = post.data.content.reduce(
      (total, contentItem): any => {
        total += contentItem.heading.split(' ').length;

        return total;
      },
      0
    );

    const NumberWordsInTheBody = RichText.asText(
      post.data.content.reduce((prev, next) => [...prev, ...next.body], [])
    ).split(' ').length;

    const totalWords = NumberWordsInTheBody + NumberWordsInTheHead;

    console.log(NumberWordsInTheBody);

    return totalWords;
  }

  const totalWords = calcTimeToRead();
  const timeToRead = Math.ceil(totalWords / 200);

  return (
    <div className={styles.post}>
      <Header />
      {post.data.banner.url && (
        <img src={post.data.banner.url} alt="" className={styles.banner} />
      )}
      <article>
        <h1>{post.data.title}</h1>
        <div className={styles.postInfos}>
          <span>
            <img src="/img/calendar.svg" alt="" />
            <time>
              {format(parseISO(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
          </span>
          <span>
            <img src="/img/user.svg" alt="" />
            <p>{post.data.author}</p>
          </span>
          <span>
            <p>{`${timeToRead} min`}</p>
          </span>
        </div>
        {post.data.content.map(content => (
          <div key={post.uid} className={styles.postContent}>
            <h2 key={content.heading}>{content.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
      </article>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { pageSize: 3 }
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post: Post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post: post,
    },
    revalidate: 60 * 60 * 24, //24h
  };
};
