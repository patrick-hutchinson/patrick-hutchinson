import type {StructureResolver} from 'sanity/structure'
import {DashboardIcon} from '@sanity/icons/Dashboard'
import {MasterDetailIcon} from '@sanity/icons/MasterDetail'

// Define singleton document IDs here
const pages = ['site', 'home', 'info']
const definitions = ['category']

// Add other types you want to hide from Desk here
const hiddenTypes = ['site', ...pages, ...definitions]

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      // Top-level singleton
      S.listItem()
        .title('Site')
        .icon(DashboardIcon)
        .child(S.document().schemaType('site').documentId('site')),

      S.divider(),

      // Pages folder
      S.listItem()
        .title('Pages')
        .icon(MasterDetailIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Home Page')
                .child(S.document().schemaType('home').documentId('home')),
              S.listItem()
                .title('Info Page')
                .child(S.document().schemaType('info').documentId('info')),
            ]),
        ),

      S.divider(),

      // Everything else (exclude hidden types and the ones we added above)
      ...S.documentTypeListItems().filter((listItem) => !hiddenTypes.includes(listItem.getId()!)),

      S.divider(),

      // Definitions folder
      S.listItem()
        .title('Definitions')
        .child(
          S.list()
            .title('Definitions')
            .items([
              S.listItem()
                .title('Categories')
                .schemaType('category')
                .child(S.documentTypeList('category').title('Category')),
            ]),
        ),
    ])
