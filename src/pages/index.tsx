import { GetStaticProps } from 'next';
import Header from '../components/Header';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';
import { parseISO } from 'date-fns';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  return (
    <div className={styles.home}>
      <Header />
      {postsPagination.results.map(post => (
        <Link key={post.uid} href={`/post/${post.uid}`}>
          <a className={styles.post}>
            <h1>{post.data.title}</h1>
            <p>{post.data.subtitle}</p>
            <div className={styles.postInfos}>
              <span>
                <img src="/img/calendar.svg" alt="logo" />
                <time>
                  {format(
                    parseISO(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              </span>
              <span>
                <img src="/img/user.svg" alt="" />
                <p>{post.data.author}</p>
              </span>
            </div>
          </a>
        </Link>
      ))}
    </div>
  );
}

export const getStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 20,
      ref: null,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 60 * 60 * 24, //24h
  };
};
