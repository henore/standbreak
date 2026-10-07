import React from 'react';
import {ScrollView, Text, StyleSheet, View, Linking, TouchableOpacity} from 'react-native';
import {type ColorSet, LightColors} from '../styles';

const POLICY_EMAIL = 'mailto:msz006.kobo@gmail.com';

const sections = [
  {
    title: '端末内に保存される情報',
    body: '本アプリでは、以下の情報を端末内に保存する場合があります。\n\n• タイマー設定\n• MOVE BREAKの実施履歴\n• Break回数\n• Move Time\n• Streak\n• MOVEルーティーン設定\n• 通知設定\n• テーマ設定\n• その他のアプリ設定\n\nこれらは本アプリの機能提供のために使用されます。',
  },
  {
    title: '利用状況・クラッシュ情報',
    body: '本アプリでは、品質改善、不具合の調査、利用状況の把握のため、Google Firebase AnalyticsおよびFirebase Crashlyticsを利用する場合があります。\n\nこれらのサービスにより、端末情報、OSやアプリのバージョン、アプリの利用状況、クラッシュ情報、IPアドレス等の技術情報が処理される場合があります。',
  },
  {
    title: 'Pro機能・アプリ内購入',
    body: 'Pro機能は買切型のアプリ内購入として提供されます。\n\n購入処理はApple App StoreまたはGoogle Playを通じて行われ、購入状態の管理にはRevenueCatを利用する場合があります。\n\nohesoftおよび本アプリが、クレジットカード番号や銀行口座情報等の完全な決済情報を直接取得または保存することはありません。',
  },
  {
    title: '広告',
    body: '本アプリには広告を表示しません。',
  },
  {
    title: '通知',
    body: '本アプリは、WORKタイマーの終了やMOVE BREAKを知らせるために通知機能を使用します。\n\n通知はユーザーが許可した場合のみ利用され、端末またはアプリの設定から変更できます。',
  },
  {
    title: '健康情報について',
    body: '本アプリは医療機器ではなく、医学的診断、治療または疾病予防を目的とするものではありません。\n\n運動やストレッチは、体調に合わせて無理のない範囲で行ってください。',
  },
];

type Props = {
  colors?: ColorSet;
};

export default function PrivacyPolicyScreen({colors}: Props) {
  const c = colors || LightColors;
  const st = makeStyles(c);

  return (
    <View style={st.container}>
      <ScrollView contentContainerStyle={st.content}>
        <Text style={st.heading}>プライバシーポリシー</Text>
        <Text style={st.updated}>最終更新日：2026年10月8日</Text>
        <Text style={st.intro}>
          Stand Break（以下「本アプリ」）は、ohesoftが提供する、長時間の座りっぱなしを減らすことを支援するウェルネスアプリです。
        </Text>
        <Text style={st.intro}>
          本アプリはアカウント登録を必要としません。
        </Text>

        {sections.map(sec => (
          <View key={sec.title} style={st.section}>
            <Text style={st.sectionTitle}>{sec.title}</Text>
            <Text style={st.body}>{sec.body}</Text>
          </View>
        ))}

        <View style={st.section}>
          <Text style={st.sectionTitle}>お問い合わせ</Text>
          <Text style={st.contactLabel}>開発者：ohesoft</Text>
          <TouchableOpacity onPress={() => Linking.openURL(POLICY_EMAIL)}>
            <Text style={st.link}>msz006.kobo@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <View style={st.footer} />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ColorSet) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      padding: 20,
    },
    heading: {
      color: c.text,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 4,
    },
    updated: {
      color: c.textMuted,
      fontSize: 13,
      marginBottom: 16,
    },
    intro: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 12,
    },
    section: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 16,
      marginBottom: 10,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 6,
    },
    body: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    contactLabel: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 8,
    },
    link: {
      color: c.accent,
      fontSize: 14,
      marginTop: 4,
    },
    footer: {
      height: 40,
    },
  });
}
