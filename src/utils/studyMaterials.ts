/**
 * studyMaterials.ts — 자료방 데이터 CRUD 헬퍼
 * ---------------------------------------------------------------
 * study_materials Supabase 테이블에 대한 조회/추가/수정/삭제 함수.
 * - listMaterials(): 공개 자료 목록 (읽기, 게스트 포함)
 * - addMaterial(): 관리자 전용 자료 추가
 * - updateMaterial(): 관리자 전용 수정 (제목/설명/링크/순번)
 * - deleteMaterial(): 관리자 전용 삭제
 */
import { supabase } from './supabase/client';

export interface StudyMaterial {
  id: string;
  order_num: number;
  title: string;
  description: string | null;
  download_url: string;
  link_label: string | null;
  category: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export async function listMaterials(): Promise<StudyMaterial[]> {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .eq('is_visible', true)
      .order('order_num', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[studyMaterials] list error:', error);
      return [];
    }
    return (data || []) as StudyMaterial[];
  } catch (err) {
    console.warn('[studyMaterials] list exception:', err);
    return [];
  }
}

/** 관리자용 — 감춘 자료 포함 전체 목록 */
export async function listAllMaterialsAdmin(): Promise<StudyMaterial[]> {
  try {
    const { data, error } = await supabase
      .from('study_materials')
      .select('*')
      .order('order_num', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as StudyMaterial[];
  } catch { return []; }
}

export type NewMaterial = Omit<StudyMaterial, 'id' | 'created_at' | 'updated_at'>;

export async function addMaterial(m: Partial<NewMaterial> & { title: string; download_url: string }): Promise<{ ok: boolean; reason?: string }> {
  try {
    const payload = {
      order_num:    Number.isFinite(m.order_num) ? m.order_num : 0,
      title:        m.title,
      description:  m.description ?? null,
      download_url: m.download_url,
      link_label:   m.link_label ?? '다운로드',
      category:     m.category ?? null,
      is_visible:   m.is_visible ?? true,
    };
    const { error } = await supabase.from('study_materials').insert(payload);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

export async function updateMaterial(id: string, patch: Partial<NewMaterial>): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { error } = await supabase
      .from('study_materials')
      .update(patch)
      .eq('id', id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}

export async function deleteMaterial(id: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { error } = await supabase.from('study_materials').delete().eq('id', id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' };
  }
}
