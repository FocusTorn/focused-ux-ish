// This file is intentionally simple.
// Its purpose is to be injected by esbuild to ensure that 'reflect-metadata'
// is the very first import in the final bundle, which is required by tsyringe.
import 'reflect-metadata'