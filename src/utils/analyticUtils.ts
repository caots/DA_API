import config from '@src/config';
import fetch from 'node-fetch';

const GG_Analytics = {
  isDebug: false,
  ua: {//Universal Analytics
    logPageView: async (params: { url: string, host?: string, remoteAddress?: string, userAgent: string, referer?: string, encoding?: string, language?: string, tid: string, cid?: string }) => {
      const {
        url, host, remoteAddress, userAgent, referer, encoding, language, tid, cid = '555'
      } = params
      let data: any = {
        v: '1',
        t: 'pageview',
        tid,
        cid,
        dp: url,
        ...host && { dh: host },
        ...remoteAddress && { uip: remoteAddress },
        ...userAgent && { ua: userAgent },
        ...referer && { dr: referer },
        ...encoding && { de: encoding },
        ...language && { ul: language }
      }
      const queryString = Object.keys(data).map(e => `${e}=${encodeURIComponent(data[e])}`).join('&');
      const isDebug = GG_Analytics.isDebug;
      const path = `https://www.google-analytics.com/${isDebug ? 'debug/' : ''}collect`;
      const response = await fetch(path, {
        method: 'post',
        body: queryString,
      });
      if (isDebug)
        console.log(await response.text())
    },
    logEvent: (params: {
      category: string, action: string, label?: string, value?: number | string, cid?: string, tid: string, userAgent: string, params?: object
    }) => {
      return GG_Analytics.ua.logEvents([params]);
    },
    logEvents: async (params: Array<{
      category: string, action: string, label?: string, value?: number | string, cid?: string, tid: string, userAgent: string, params?: object
    }>) => {
      const events = params.map(({ category, action, label, value, cid = '555', tid, userAgent }) => {
        const event = {
          v: '1',
          tid,
          cid,
          t: 'event',
          ua: userAgent,
          ec: category,
          ea: action,
          ...label && { el: label },
          ...value && { ev: value },
          ...params
        };
        const queryString = Object.keys(event).map(e => `${e}=${encodeURIComponent(event[e])}`).join('&');
        return queryString;
      })

      const isDebug = GG_Analytics.isDebug;
      const path = `https://www.google-analytics.com/${isDebug ? 'debug/' : ''}${events.length > 1 ? 'batch' : 'collect'}`;
      const response = await fetch(path, {
        method: 'post',
        body: events.join('\n'),
      });
      if (isDebug)
        console.log(await response.text())
    }
  },
  GA4: {
    logPageView: async (params: {
      measurement_id: string,
      api_secret: string,
      user_properties?: object,
      user_id?: string,
      client_id?: string,
      timestamp_micros?: number,
      non_personalized_ads?: boolean,
      page: {
        page_title: string,
        page_path: string,
        page_location?: string,
      }
      params?: Object
    }) => {
      const {
        page,
        params: _params,
        ...rest
      } = params;
      return GG_Analytics.GA4.logEvent({
        ...rest,
        event: {
          name: 'page_view',
          params: {
            ..._params,
            ...page
          }
        }
      })
    },
    logEvent: (params: {
      measurement_id: string,
      api_secret: string,
      user_properties?: object,
      user_id?: string,
      client_id?: string,
      timestamp_micros?: number,
      non_personalized_ads?: boolean,
      event: {
        name: string
        params?: object,
      }
    }) => {
      const {
        event,
        ...rest
      } = params
      return GG_Analytics.GA4.logEvents({
        ...rest,
        events: [event]
      });

    },
    logEvents: async (params: {
      measurement_id: string,
      api_secret: string,
      user_properties?: object,
      user_id?: string,
      client_id?: string,
      timestamp_micros?: number,
      non_personalized_ads?: boolean,
      events: Array<{
        name: string
        params?: object,
      }>
    }) => {
      const {
        measurement_id,
        api_secret,
        user_properties,
        user_id,
        client_id = '555',
        timestamp_micros = new Date().getTime() * 1000,
        non_personalized_ads = false,
        events
      } = params
      const isDebug = GG_Analytics.isDebug;
      const body = {
        client_id,
        ...user_id && { user_id },
        ...user_properties && { user_properties },
        timestamp_micros,
        non_personalized_ads,
        events
      };
      const response = await fetch(`https://www.google-analytics.com/${isDebug ? 'debug/' : ''}mp/collect?api_secret=${api_secret}&measurement_id=${measurement_id}`, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
      if (isDebug)
        console.log(await response.text())
    }
  }
}

export default class AnalyticUtils {
  constructor() {

  }

  public static async logPageView(url: string, title: string, params?: object, location = null,): Promise<any> {
    // return GG_Analytics.ua.logPageView({
    //   url,
    //   tid: 'UA-178254277-1',
    //   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36'
    // });
    return GG_Analytics.GA4.logPageView({
      api_secret: config.GA_API_SECRET,
      measurement_id: config.GA_MEASUREMENT_ID,
      page: {
        page_path: url,
        page_title: title,
        page_location: location,
      },
      params
    });
  }
  public static async logEvents(events: Array<{
    category: string, action: string, label?: string, value?: string | number
  }>): Promise<any> {

    // return GG_Analytics.ua.logEvents(events.map(({ category, action, label = null, value = null }) => ({
    //   category, action, label, value,
    //   tid: 'UA-178254277-1',
    //   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
    // })));

    const _events = events.map(({ category, action, label, value }) => ({
      // name: category,
      // params: {
      //   [action]: label == null && value == null ? action :
      //     label == null && value != null ? value :
      //       label != null && value == null ? label :
      //         JSON.stringify({
      //           [label]: value
      //         })
      // }
      name: action,
      params: {
        [label]: value
      }
    }))
    return GG_Analytics.GA4.logEvents({
      api_secret: config.GA_API_SECRET,
      measurement_id: config.GA_MEASUREMENT_ID,
      events: _events
    });
  }
  public static async logEvent(category: string, action: string, label: string = null, value: string | number = null): Promise<any> {
    return AnalyticUtils.logEvents([{ category, action, label, value }]);
  }
}