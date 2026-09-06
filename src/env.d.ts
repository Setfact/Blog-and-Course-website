/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { Profile } from './types/database';

declare global {
  namespace App {
    interface Locals {
      user: Profile | null;
    }
  }
}
